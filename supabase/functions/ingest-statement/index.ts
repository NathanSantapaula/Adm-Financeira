// Supabase Edge Function: ingest-statement  (MODELO: revise, publique e teste antes de ligar em produção)
// Recebe o payload montado por FPIngest.montarPayloadIA (assets/js/ingest.js) e devolve transações categorizadas.
//   modo "extrair":    lê um PDF (fatura, extrato, relatório) enviado ao bucket privado "ingestao".
//   modo "categorizar": só recategoriza linhas de baixa confiança já lidas de um CSV/OFX.
// Segredos (supabase secrets set ...): ANTHROPIC_API_KEY e, opcionalmente, LLM_MODEL.
// Privacidade: o conteúdo do arquivo é enviado ao provedor de IA. Informe isso nos termos e apague o arquivo após o uso (feito abaixo).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const MODELO = Deno.env.get('LLM_MODEL') ?? 'claude-sonnet-5-5';
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'content-type': 'application/json' } });

const SISTEMA = `Você extrai e categoriza lançamentos financeiros de documentos brasileiros (extratos, faturas de cartão, relatórios).
Responda SOMENTE com JSON válido, sem texto antes ou depois, neste formato:
{"versao":1,"transacoes":[{"id":"","data":"AAAA-MM-DD","descricao":"","valor":0,"destino":"despesa|renda|investimento|provento|ignorar","catTipo":"fixa|variavel","area":"","sub":"","ativo":"","confianca":0.0}],"avisos":[]}
Regras: valor negativo = saída de dinheiro, positivo = entrada. Em fatura de cartão, compras são saídas e "pagamento recebido" é "ignorar".
Pagamento de fatura e transferência entre contas próprias: "ignorar". Compra de ativos e aplicações: "investimento" (informe "ativo"). Dividendos e rendimentos: "provento".
Nunca invente transações. Se não tiver certeza, use confianca baixa. Use as áreas e categorias do contexto quando fizerem sentido.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let sb: ReturnType<typeof createClient> | null = null; let caminho = '';
  try {
    const auth = req.headers.get('Authorization') ?? '';
    sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ erro: 'Não autenticado.' }, 401);
    const { data: ass } = await sb.from('assinaturas').select('plano,status').eq('user_id', user.id).maybeSingle();
    if (!ass || ass.plano !== 'completo' || ass.status !== 'ativo') return json({ erro: 'Recurso do plano Assessoria.' }, 403);

    const p = await req.json();
    if (p?.versao !== 1) return json({ erro: 'Versão de payload não suportada.' }, 400);
    const content: unknown[] = [];
    if (p.modo === 'extrair') {
      caminho = String(p.arquivo?.caminho ?? '');
      if (!caminho.startsWith(user.id + '/')) return json({ erro: 'Arquivo inválido.' }, 403);
      const { data: blob, error } = await sb.storage.from('ingestao').download(caminho);
      if (error || !blob) return json({ erro: 'Arquivo não encontrado.' }, 404);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (bytes.length > 10 * 1024 * 1024) return json({ erro: 'PDF acima de 10 MB.' }, 413);
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: encodeBase64(bytes) } });
    } else {
      content.push({ type: 'text', text: 'Linhas a categorizar (JSON): ' + JSON.stringify((p.transacoes ?? []).slice(0, 300)) });
    }
    content.push({ type: 'text', text: 'Contexto do usuário (JSON): ' + JSON.stringify(p.contexto ?? {}) + '\n' + (p.instrucoes ?? '') });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODELO, max_tokens: 8000, system: SISTEMA, messages: [{ role: 'user', content }] }),
    });
    if (!r.ok) return json({ erro: 'A IA não respondeu.' }, 502);
    const texto: string = (await r.json())?.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '';
    const ini = texto.indexOf('{'); const fim = texto.lastIndexOf('}');
    if (ini < 0 || fim < ini) return json({ erro: 'Resposta da IA fora do formato.' }, 502);
    return json(JSON.parse(texto.slice(ini, fim + 1)));
  } catch (_e) {
    return json({ erro: 'Falha na leitura.' }, 500);
  } finally {
    // não guarda o documento: apaga o PDF mesmo quando a leitura falha no meio
    if (sb && caminho) await sb.storage.from('ingestao').remove([caminho]).catch(() => {});
  }
});
