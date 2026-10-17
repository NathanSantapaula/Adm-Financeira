# AVEN Financial Planning, por Nathan Santapaula

Sistema web de planejamento financeiro com assessoria: página inicial persuasiva, cadastro com login, diagnóstico (patrimônio e perfil de investidor), painel de boas-vindas, rendas, **conta corrente em meses (accordions)**, **importação inteligente de extratos CSV e OFX**, investimentos, proventos, carteira com rebalanceamento por aporte, **três planos**, **temas e tom de voz personalizáveis**, relatório para impressão, backup completo e área do consultor.

É um site **estático** (HTML, CSS e JavaScript puros, sem build). Hospede no **GitHub Pages** e use o **Supabase** como banco de dados, login e (opcionalmente) armazenamento e IA.

```
index.html
assets/css/app.css            design system v3 (tokens, 3 temas, vidro, microinterações)
assets/js/config.js           <- o ÚNICO arquivo que você precisa editar
assets/js/engine.js           cálculos, parcelamento, planos e permissões, rebalanceamento, backup
assets/js/ingest.js           leitura de CSV/OFX, categorização, duplicidade, conciliação, payload de IA
assets/js/ingest-ui.js        tela de importação (arrastar arquivo, prévia editável)
assets/js/plans.js            permissões por plano na interface (bloqueios e upgrade)
assets/js/prefs.js            temas (Claro, Dark OLED, Personalizado) e tom de voz
assets/js/report.js           visão do consultor, carteira recomendada e relatório
assets/js/store.js            camada de dados (Supabase ou navegador)
assets/js/*.js                demais telas e interface
supabase/schema.sql           tabelas e regras de segurança (instalação nova)
supabase/migrations/          atualização para quem já tinha o banco da versão anterior
supabase/functions/           Edge Function opcional para leitura de PDF por IA
tests/                        testes do motor de cálculo e da ingestão
```

## 1. Testar na sua máquina (modo demonstração)

Abra `index.html` no navegador, ou rode `npx serve .`. Sem Supabase configurado, tudo funciona em **modo demonstração**: os dados ficam só no navegador e todos os recursos ficam liberados. Serve para conhecer o produto, não para clientes.

## 2. Configurar o banco e o login (Supabase)

**Instalação nova**

1. Crie um projeto gratuito em https://supabase.com.
2. No **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute. Ele já inclui os três planos, a tabela de recomendações e o armazenamento da ingestão.
3. Em **Authentication > Providers**, deixe **Email** ativo. Recomendado: manter "Confirm email" ligado.
4. Em **Authentication > URL Configuration**, informe a URL do seu site no GitHub Pages em **Site URL** e em **Redirect URLs** (exemplo: `https://seu-usuario.github.io/financial-planning/`).
5. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public** para `assets/js/config.js`:
   ```js
   supabase: { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...' },
   ```
   A chave anon é pública por natureza: quem protege os dados são as regras (RLS) do `schema.sql`. **Nunca** coloque a chave `service_role` no site.
6. Crie a sua conta pelo próprio site e, no SQL Editor, torne-se consultor:
   ```sql
   insert into public.consultores (user_id) select id from auth.users where email = 'seu-email@exemplo.com';
   ```
   Depois disso aparece a aba **Clientes** no seu menu.

**Projeto que já usa a versão anterior**

Não rode o `schema.sql` de novo. Cole no SQL Editor apenas `supabase/migrations/002_planos_ingestao.sql` e execute (pode repetir sem problema). Ela:

- aceita o plano `investidor` (o plano `completo` continua existindo e passa a se chamar **Assessoria** na interface, então clientes que já pagam não precisam de nenhum ajuste);
- cria a tabela `recomendacoes` (carteira recomendada e notas do assessor);
- permite que você, consultor, leia o planejamento **somente de clientes com a Assessoria ativa**;
- cria o bucket privado `ingestao` para PDFs.

## 3. Os três planos

| Recurso | Organização (grátis) | Investidor | Assessoria |
|---|---|---|---|
| Visão geral, rendas, conta corrente por mês, despesas, orçamento | sim | sim | sim |
| Importar extrato CSV/OFX (despesas e rendas) | sim | sim | sim |
| Backup completo | sim | sim | sim |
| Investimentos, proventos, patrimônio, carteira e rebalanceamento | bloqueado | sim | sim |
| Importar investimentos e proventos do extrato; importar planilha .xlsx | bloqueado | sim | sim |
| Carteira recomendada pelo assessor, relatório avançado, leitura de PDF por IA | bloqueado | bloqueado | sim |
| O consultor enxerga o planejamento do cliente | não | não | sim |

- A regra fica em `assets/js/engine.js` (`RECURSOS`, `planoPermite`) e é aplicada na interface (`plans.js`) e na ingestão. Os bloqueios mostram um cartão explicando o que o plano seguinte libera, com botão de contratar.
- Para mudar qual plano libera um recurso sem mexer no código, use `recursos` em `config.js`, por exemplo `recursos: { carteira: 'completo' }`. Lista de recursos e planos está nos comentários do arquivo.
- A interface é só a primeira camada. O que protege de verdade o que o consultor vê é o banco (RLS, migration 002), e a Edge Function confere o plano antes de chamar a IA.

**Preços:** `precoPor` e `precoRegular` definem a Assessoria (o regular aparece riscado acima do preço de lançamento). `precoInvestidor` é o preço do plano Investidor (hoje `54.75`); vazio mostra "Sob consulta". Na página inicial os planos aparecem em ordem crescente, em degraus, com a Assessoria em destaque. "Quero a assessoria" leva direto à tela de pagamento: logado, na hora; sem conta, logo após o cadastro (o diagnóstico fica para depois; se o cadastro pedir confirmação de e-mail, o primeiro acesso já abre o pagamento). `paymentUrl` é o link de pagamento da Assessoria. Para o plano Investidor, o link fica em `paymentUrlInvestidor` em `config.js` (já configurado); sem ele, a tela de assinatura do Investidor não mostra botão de pagamento e orienta o cliente a falar com você.

## 4. Importação inteligente de extratos

Botão **Importar extrato** na aba Gastos. Funciona no navegador, sem enviar nada para servidor:

1. Arraste um arquivo **.csv** (extrato ou fatura de cartão) ou **.ofx** (Open Finance/internet banking). O leitor detecta a codificação (UTF-8, UTF-16, Windows-1252), o separador e as colunas (data, histórico, valor, ou colunas separadas de débito e crédito).
2. Cada linha é **categorizada** por regras (mercado, transporte, assinaturas, salário, tickers de ações e FIIs, etc.) e recebe um nível de confiança. Pagamento de fatura e transferências entre contas próprias são marcados como neutros para não duplicar gasto.
3. A prévia é **editável**: troque destino (gasto, renda, investimento, provento, ignorar), área, categoria, ou desmarque linhas. Ao corrigir uma linha, a opção "Lembrar para este estabelecimento" já vem marcada e o sistema aprende a sua regra (resumo e botão "Esquecer o que aprendi" em Painel administrativo > Importação de extratos).
4. O sistema evita **duplicidade**: reimportar o mesmo arquivo ou a mesma transação não repete lançamentos. Quando um gasto casa com um item planejado do mês, a importação dá **baixa** nele em vez de contar duas vezes.
5. O que for confirmado vai para a aba certa: despesas e rendas (como lançamentos reais dentro do mês), investimentos e proventos (planos Investidor e Assessoria).

**Carteira pela B3 (planos Investidor e Assessoria).** Em Investimentos ou Proventos, botão **Importar da corretora**. O cliente entra em investidor.b3.com.br (Área do Investidor, gratuita, reúne todas as corretoras), abre **Extratos**, escolhe **Movimentação** (compras, vendas e proventos) ou **Negociação** (só compras e vendas), baixa em Excel e solta o arquivo. O sistema lê `.xlsx` e `.csv`, reconhece ações, FIIs, ETFs, BDRs, Tesouro Direto e renda fixa bancária, lança compras como aporte, vendas, resgates e amortizações como redução do aporte, e dividendos, JCP e rendimentos como proventos do ativo. Eventos sem dinheiro (bonificação, desdobro, atualização, transferência de custódia) são ignorados e informados. Reimportar o mesmo período não duplica nada.

**Leitura de PDF e refino por IA (opcional, plano Assessoria).** Fica desligada por padrão. Para ligar:

```bash
supabase functions deploy ingest-statement
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...            # chave só no servidor
supabase secrets set LLM_MODEL=claude-sonnet-5-5             # opcional
```

Depois, em `assets/js/config.js`, troque `ingestao.iaAtiva` para `true`. A função confere login, plano Assessoria e a pasta do arquivo, lê o PDF, devolve JSON validado pelo site e **apaga o arquivo** depois do uso. O conteúdo do documento é enviado ao provedor de IA: mantenha isso claro nos Termos e peça consentimento do cliente. O arquivo `supabase/functions/ingest-statement/index.ts` é um **modelo**: revise, publique e teste com um PDF seu antes de oferecer ao cliente.

## 5. Rendas, Investimentos e Proventos como painel de estudo

Os indicadores e cada cartão dessas três abas (e da Carteira) são widgets, como na Visão geral e em Gastos: **Organizar a tela** (no fim dos widgets, ou segurando um deles) permite arrastar, mudar a largura, tirar e adicionar, e **Mais opções** abre a lista completa (também em Painel › Telas). A escolha fica no perfil e os widgets se encaixam sem deixar espaços vazios. A planilha mês a mês continua fixa no fim de cada aba.

A planilha mês a mês continua disponível, recolhida no fim da página. Acima dela:

- **Investimentos:** aportado no ano e média mensal, ritmo em relação à meta de aporte, constância (meses com aporte), diversificação (número efetivo de ativos e maior posição), aportes mês a mês contra a meta, composição por classe, renda fixa contra renda variável comparada à referência do perfil, maiores posições e uma lista "Para estudar" (risco de concentração, desvio do perfil, projeção ilustrativa de 10 anos).
- **Proventos:** recebido no ano, média por mês, yield on cost, cobertura dos gastos pelos proventos, proventos mês a mês, ranking de quem mais paga (com meses pagos e yield de cada ativo), calendário de pagamentos e o "número da independência" (quanto seria preciso investido para os proventos pagarem os gastos médios, e em quanto tempo no ritmo atual).

- **Rendas:** entradas no ano e média mensal, previsibilidade (quanto vem de fontes recorrentes), taxa de poupança, renda passiva, entradas mês a mês por categoria contra o total de gastos, estabilidade (menor, maior e média, com os meses abaixo da média destacados), ranking das fontes (recorrente ou eventual) e "Para estudar" (dependência de uma fonte com a reserva sugerida de 6 a 12 meses de gastos, oscilação, peso dos gastos fixos sobre a renda recorrente e poupança contra a referência de 20%). O cadastro e a edição continuam em "Rendas mês a mês", recolhido no fim.
Tudo é calculado a custo (ou pelo valor atual que o cliente informar na Carteira), sem cotação de mercado. As projeções usam o retorno hipotético do Painel e são ilustrativas.

### Carteira

A aba Carteira é feita de widgets organizáveis sobre `E.analiseCarteira` (`engine.js`, com testes): **Alvos e quanto você tem** (editor por classe: cada classe é uma linha compacta com seta, alvo somado e barra de hoje contra o alvo, e abre para mostrar os ativos; em cada ativo, um controle deslizante e um campo de % para o alvo, a soma dos alvos ao vivo numa barra, "Tenho hoje" e preço da cota por ativo, com o botão para voltar à soma dos aportes, e atalhos para usar a alocação do perfil, distribuir igualmente ou zerar), **Onde investir este mês** (mês e valor do aporte, quanto vai para cada ativo, as cotas e uma barra com hoje, depois do aporte e o alvo, e o botão para registrar em Investimentos), **Composição da carteira** (um anel por classe; passar o mouse ou focar destaca a fatia e mostra valor, % hoje, % alvo e a diferença no centro; tocar numa classe entra nela e mostra os ativos de dentro, e tocar num ativo leva ao alvo dele no editor; as fatias se desenham na entrada e ao trocar de nível, exceto com movimento reduzido), **Cada investimento** (um cartão por ativo com valor, % hoje contra o alvo, situação e quanto recebe no aporte), **Equilíbrio por classe** e **Mais longe do alvo**. A carteira recomendada pelo assessor aparece como widget quando existir. "Onde investir" e "Composição" têm um botão de expandir (canto do cartão) que abre o cartão por cima da tela; Esc, o X ou um toque fora fecham. Sem expandir, as listas longas rolam dentro do cartão.

### Simulador do objetivo (“E se?”)

No card do patrimônio, ao lado de "Histórico", o botão **E se?** abre o **Simulador do objetivo** numa janela sobre a tela (no celular, uma folha que sobe de baixo). A página por trás não muda. A janela fecha pelo X, pela tecla Esc ou com um toque fora dela, e o foco volta ao botão. O link "E se eu aportar mais? Simular", no card de objetivos, também abre o simulador. Ele tem dois controles: aporte extra por mês (com atalhos de +10%, +25%, +50% e Dobrar) e retorno anual (de 2% a 20%, com um traço na taxa do perfil). Ao mover qualquer um deles, o card recalcula na hora, com juros compostos mês a mês (`E.simularObjetivo`, que usa `mesesAteMeta` e `projetar`):

- o novo prazo, em anos e meses, e o mês previsto;
- a diferença para o cenário atual ("Você antecipa sua meta em 2 anos e 4 meses" ou "Sua meta atrasa…");
- o gráfico com o cenário atual tracejado, a simulação e a linha do objetivo;
- quanto do valor da meta sai do bolso e quanto vem dos juros.

"Usar como minha meta de aporte" grava o novo aporte no planejamento do ano (com Desfazer). O cenário simulado não é salvo: vale só enquanto a página está aberta. O retorno é constante e hipotético, sem inflação, impostos ou taxas, e o card avisa isso. No plano Organização, que não acompanha patrimônio, o simulador não aparece.

### Tela de abertura

Na primeira entrada de cada sessão, quem já tem patrimônio vê **Seu universo financeiro** antes do painel: um globo de pontos que gira sozinho (arraste para girar; os pontos se afastam do mouse), com as cores das classes da carteira. Em volta, os dividendos recebidos são pontinhos dourados, os aportes de cada mês são losangos verdes numa órbita própria, as classes da carteira são orbs que pulsam do tamanho da proporção e os objetivos são cristais em órbita, com o progresso desenhado na borda (o nome e o percentual aparecem só ao tocar). Tocar em qualquer um (ou parar o mouse em cima) prende só aquele item no lugar, para ele não fugir do dedo, e mostra o detalhe, enquanto o resto continua girando; ao fechar, ele volta deslizando para a órbita. Segurar um item e arrastar leva ele junto com o dedo; ao soltar, ele pode ser arremessado e volta aos poucos para a rota. O item tocado brilha e treme bem de leve enquanto o detalhe está aberto. Os aportes são losangos, um pouco maiores e mais brilhantes quanto maior o aporte. Dá para aproximar com a roda do mouse, dois dedos, dois toques ou os botões + e − (no celular, só pela pinça e pelos toques) (e "Aproximar" no detalhe); com zoom, arrastar move a vista. O valor do centro fica sempre legível: em volta dele os pontos recuam e um véu suave dá contraste; o "i" que sobrevoa o globo explica cada símbolo. O título conversa com as mesmas frases da Visão geral, e o cartão **Ao vivo** mostra quanto o patrimônio rendeu hoje numa simulação de 12% ao ano, contando só o horário comercial de Brasília (dias úteis, das 9h às 18h). À noite, no fim de semana e nos feriados nacionais ele aparece "Fora do ar", em vermelho, com quanto rende um dia útil inteiro (sem promessa de resultado). A tela segue o tema do painel, inclusive no Personalizado: no escuro, um globo de luz no espaço; no claro, uma esfera de vidro na cor de destaque sobre um fundo claro com um halo da mesma cor, e todas as cores em volta (classes, objetivos, aportes) saem de tons vizinhos da cor de destaque, para a cena conversar como um conjunto; só os dividendos guardam o dourado. Quando o aparelho não consegue rodar o globo completo (sem canvas, um erro ao desenhar ou menos de 12 quadros por segundo logo depois da entrada), a tela troca sozinha para uma **versão simples**: só a esfera com o valor do patrimônio no meio e dois anéis girando em volta, feita em CSS. No canto, as setas do ano mostram o globo de outros anos com patrimônio (dezembro de cada ano, realizado ou previsto; o Ao vivo só aparece no ano corrente), e trocar o ano ali troca também o ano do painel. O globo tem o próprio olhinho para ocultar os valores; com "reduzir movimento", a cena fica parada. "Entrar no meu painel" (ou Esc) segue para a Visão geral.

Em **Painel › Personalizar o painel › Globo do Patrimônio** o cliente decide se a tela aparece, se aparece toda vez que entrar ou só uma vez por dia, e o que fica nela: conversa no título, Ao vivo, investimentos, objetivos, aportes, dividendos e o ícone de ajuda. Em **Versão do globo** ele pode fixar a versão simples. Em **Valores ao abrir** ele escolhe se o globo abre como o olhinho do painel está (e o olho do globo passa a valer para o painel também), sempre com os valores visíveis ou sempre com eles ocultos (nesses dois casos o olho do globo vale só para ele). O botão "Ver a tela agora" mostra o resultado na hora. A qualquer momento, o botão do globo no topo das telas do painel, ao lado do olho e do sino, abre a tela de novo.

### Visão geral personalizável

**Organizar na própria tela, como no celular.** Segurar qualquer widget por meio segundo, ou tocar em "Organizar a tela" no fim da Visão geral, solta os widgets: eles balançam e ganham um botão vermelho para tirar da tela, um botão de largura (no computador) e setas. Dá para arrastar com o dedo ou o mouse, e os vizinhos abrem espaço enquanto o widget é arrastado. Se o dedo continuar no lugar depois de segurar, o arraste já começa. Perto da borda, a tela rola sozinha. A barra do topo tem "Adicionar", que lista os widgets fora da tela, e "Concluir". Esc também sai do modo. No celular, para arrastar é preciso segurar o widget um instante; deslizar direto continua rolando a página. Tirar um widget da tela tem Desfazer, e a ordem fica salva na conta.

Em **Painel › Visão geral › Personalizar** (ou no botão "Personalizar a Visão geral", no fim da própria Visão geral), o cliente monta a tela inicial:

- **Ligar e desligar:** cada widget tem um botão de ligar e desligar. Os desligados ficam em "Disponíveis para adicionar".
- **Largura:** Estreito (1/3), Metade, Largo (2/3) ou Inteiro, conforme o widget. No celular, todos ocupam a largura toda.
- **Ordem:** arrastando pela alça (mouse) ou pelas setas (toque e teclado). Uma miniatura mostra como a tela vai ficar.
- **Restaurar o padrão:** volta ao layout original, com Desfazer.

Widgets disponíveis: Patrimônio estimado (ou Sobra para investir), Objetivos, Orçamento do mês, Indicadores do ano, Para onde foi cada mês, Constância dos aportes, Composição da carteira, Onde você mais gasta, O que o painel está vendo e Assessor e próximos passos, que formam a tela padrão. Para adicionar: Orçamento e gastos, Proventos mês a mês, Todos os objetivos, Avisos (os três mais importantes da central), Atalhos e Patrimônio ano a ano. Widgets que o plano não libera não aparecem, mas a escolha fica guardada para quando o plano mudar. O layout fica no perfil (`perfil.painel`), então acompanha o cliente em qualquer aparelho.

### Constância dos aportes

No lugar do antigo gráfico "Orçamento e gastos", que repetia o indicador de orçamento do topo, a Visão geral mostra a **Constância dos aportes**: o dinheiro novo investido em cada mês (sem contar proventos reinvestidos), comparado com a meta mensal. Abaixo do gráfico aparecem os meses na meta (por exemplo, 9 de 10), a sequência atual de meses na meta e a média por mês. Sem meta definida, mostra os meses com aporte e um atalho para definir a meta. No plano Organização, que não acompanha investimentos, o espaço mostra **Gastos fixos e variáveis** mês a mês e o peso dos gastos fixos.

### Linha do tempo de todos os anos

No card principal da Visão geral, o botão discreto "Histórico" abre a **Evolução histórica do patrimônio** numa janela sobre a tela, como o simulador. Ela consolida todos os anos de planejamento (`E.historico`, no `engine.js`), em ordem, do primeiro ano com dados até o mês atual. Anos futuros ficam de fora.

- **Indicadores do período:** patrimônio hoje e quanto cresceu desde o início, entradas, gastos, taxa de poupança acumulada, quanto foi investido do próprio bolso e proventos recebidos.
- **Gráfico com três visões:** patrimônio mês a mês, uma curva contínua com uma faixa por ano e pontos em Dez/24, Dez/25 e Hoje; renda e gastos, com entradas, gastos e sobra por ano; e aportes e proventos por ano. O ano em andamento aparece mais claro e com asterisco.
- **Tabela ano a ano:** com a variação de entradas e de gastos entre anos completos.
- **Para estudar:** a renda cresceu mais rápido que os gastos? Qual foi o melhor ano de poupança e o de maior aporte? Avisa também quando há anos faltando ou patrimônio inicial definido à mão.
- **Só um ano cadastrado:** aparece uma linha do tempo ilustrada com o botão "Registrar" do ano anterior, que cria o ano com a mesma estrutura.
- **Plano Organização:** mostra só renda, gastos e sobra.

**Âncora do patrimônio.** O patrimônio informado no diagnóstico vale para o início do ano em que foi informado (`patrimonioAno` no perfil). Os anos seguintes somam os aportes, e os anos anteriores, cadastrados depois, descontam os aportes até lá. Assim, registrar 2024 e 2025 depois de começar em 2026 não aumenta o patrimônio de hoje. Contas que já existiam usam o primeiro ano que tinham, e os números delas não mudam. O cálculo está em `E.ctxAno`, usado pelo painel, pelo relatório e pela linha do tempo.

### Múltiplos objetivos

O cliente pode ter vários objetivos ao mesmo tempo (imóvel, carro, viagem, filhos, educação, reserva, casamento, negócio próprio, aposentadoria, independência financeira ou outro), cada um com nome, valor alvo e ano limite.

- **No diagnóstico:** o passo de metas aceita vários objetivos, com atalhos para adicionar Imóvel, Carro, Viagem e outros. O resumo mostra cada objetivo com a sua fatia e a previsão de quando fica pronto.
- **Fatias:** cada objetivo recebe uma fatia (%) do patrimônio e do aporte mensal, e a soma vai até 100%. Com um objetivo só, ele fica com 100%. Com vários, o diagnóstico já divide pelo prazo: quanto mais caro e mais urgente, maior a fatia.
- **Visão geral:** o card do objetivo tem "cara de sonho": a foto do tipo de objetivo ao fundo (uma por tipo, em `assets/img/objetivos/`, todas de domínio público ou CC0, créditos em `CREDITOS.md`), um título que conta a história ("Próxima parada, Japão." quando a viagem tem nome; "A chave da casa nova.", "O grande dia." e outros quando não tem), o anel de progresso, o valor reservado contra a meta, a situação em linguagem simples ("Você está no caminho certo", "Precisa de um empurrão"), a previsão de data e o botão "E se?" no topo (ao lado da seta para Meus objetivos). As pílulas embaixo trocam o objetivo em foco. Se o cliente alargar o card (Organizar a tela), ele fica "deitado": anel e valores ao lado do prazo e a foto aparente à direita. A frase detalhada e o aviso de cálculo ficam no "i" ao lado do título. O simulador "E se?" acompanha o objetivo escolhido.
- **Painel › Meus objetivos:** lista em cartões com nome, tipo, valor, ano e fatia editáveis, barra de progresso, barra de divisão do patrimônio, botão "Dividir pelo prazo" (com Desfazer), reordenação, exclusão (com Desfazer) e uma grade de tipos para adicionar.
- **Dados:** os objetivos ficam em `perfil.objetivos` (`[{ id, tipo, nome, valor, ano, pct }]`), no mesmo JSON do perfil, sem mudança no banco. O campo antigo `perfil.objetivo` continua sendo gravado com o objetivo principal, para compatibilidade. Perfis antigos, com um objetivo só, são convertidos ao abrir, com fatia de 100%. Os cálculos estão em `E.normObjetivos`, `E.analiseObjetivos` e `E.sugerirDivisao` (com testes).

## 6. Meu perfil, foto e avatares

No painel, o topo é o cartão do cliente. Tocando nele abre **Meu perfil** (no celular, também em Mais > Meu perfil), onde ele:

- envia uma **foto** (JPG, PNG ou WebP). A imagem é recortada em quadrado e reduzida para 320 px no próprio aparelho antes de salvar, ficando com poucas dezenas de KB e guardada junto com o perfil;
- ou escolhe um dos **3 avatares** da coleção AVEN (Marca, Aurora e Camadas), desenhados com os gradientes, o vidro e a seta da marca. Quem tinha escolhido um avatar antigo passa a ver a inicial do nome até escolher outro;
- edita nome, como prefere ser chamado (usado na saudação), WhatsApp, profissão e cidade, e vê ou refaz o perfil de investidor.

A foto ou o avatar aparecem no menu, no painel e, para você, na lista de Clientes. Para acrescentar imagens próprias à coleção, use `avatares` em `config.js` (instruções no próprio arquivo).

## 7. Gastos

No topo, escolha o **mês** ou o **ano**: tudo na aba passa a mostrar esse período. Logo abaixo, quatro números: quanto foi gasto (com o orçamento do mês, editável ali mesmo), a projeção até o fim do mês no ritmo atual (e quanto ainda cabe por dia), a comparação com a média dos meses anteriores e o peso dos gastos fixos.

Depois vêm as análises, que funcionam como na Visão geral: **Organizar a tela** solta os widgets para arrastar, mudar a largura, tirar e adicionar, e **Personalizar** (ou Painel › Personalizar a aba Gastos) abre a lista completa. A escolha fica no perfil e os widgets se encaixam sem deixar espaços vazios. Por padrão aparecem para onde foi o dinheiro, ritmo do mês, mês a mês, maiores gastos e parcelamentos; os demais ficam disponíveis para adicionar: para onde foi o dinheiro (categorias e áreas, com a variação contra a média), ritmo do mês (gasto acumulado dia a dia contra o orçamento), mês a mês (fixos e variáveis), o que mudou, maiores gastos, onde você mais compra (estabelecimentos agrupados pelo nome), assinaturas e contas recorrentes, parcelamentos em andamento e gastos por dia da semana. Tocar numa área, estabelecimento ou assinatura filtra a lista.

No fim, a seção recolhível **Lançamentos** reúne todos os lançamentos do período numa lista só, com busca, filtro por categoria, por tipo (reais, previstos, importados) e agrupamento por data ou por categoria. Os cálculos estão em `E.analiseGastos` (`engine.js`, com testes). Parcelamentos continuam sendo um único item consolidado que segue pelos anos seguintes.

## 8. Central de notificações

O sino ao lado do seletor de ano, no topo de todas as telas, reúne avisos gerados automaticamente a partir do planejamento do ano corrente. O cliente não configura nada: as regras leem os mesmos números do painel e recalculam a cada alteração, importação ou mudança de dia. O número no sino mostra os avisos não lidos e fica vermelho quando algum é crítico. O título da aba do navegador também mostra a contagem.

| Grupo | Quando dispara | Ação do botão |
|---|---|---|
| Orçamento | 75%, 90% e acima de 100% do orçamento do mês; ritmo de gastos que projeta estouro (a partir do dia 7); gastos sem orçamento definido; área de gasto 40% acima da média dos meses anteriores | Ver gastos (aba Gastos, já no mês) ou Definir orçamento |
| Lembrete | Dia 5 em diante sem entradas no mês (ou, do dia 5 ao 9, convite para conferir as que já estão lá); dia 8 sem lançamentos; dia 10 sem aporte (com a sobra do mês anterior, quando houver); dia 20 em diante, fechamento do mês e quanto falta da meta de aporte; dias 1 a 5, resumo do mês anterior | Registrar entradas, Importar extrato, Aportar agora, Ver fechamento |
| Carteira | Ativo 3 p.p. ou mais abaixo do alvo (com o valor sugerido do próximo aporte); ativo 5 p.p. ou mais acima do alvo; alvos que não somam 100%; carteira sem alvo | Ver onde investir, Ajustar alvos |
| Conquista | Meta de aporte do mês batida; proventos recebidos no mês | Ver aportes, Ver proventos |

- Cada aviso vale para o mês em que surgiu. Se a situação piora, por exemplo de 90% para orçamento estourado, chega um aviso novo e o sino balança uma vez.
- O cliente pode marcar como lido ou dispensar um aviso (com Desfazer). Isso fica salvo no perfil e vale em qualquer aparelho.
- Os textos seguem a voz escolhida pelo cliente (Consultivo, Direto ou Acolhedor).
- Avisos de aporte e carteira só aparecem nos planos que têm esses recursos. Botões que levariam a uma aba oculta não aparecem.
- As regras estão em `E.notificacoes` (`engine.js`) e têm testes em `tests/engine.test.js`. A interface, os textos e o estado de leitura estão em `assets/js/notif.js`. Para criar um aviso novo, acrescente a regra em `notificacoes` com um id que inclua o mês, o título em `NOTIF_TIT` e o texto nas quatro vozes em `NOTIF_VOZ`.
- A central funciona com o site aberto. Avisos por e-mail ou push no celular exigiriam um serviço rodando no servidor (Edge Function agendada no Supabase), que ainda não existe.

### Tela limpa com o botão "i"

Descrições e recomendações não ocupam mais a tela: ficam atrás de um ícone "i" ao lado do título. Passar o mouse ou focar com o teclado mostra o texto num balão. No celular, um toque fixa o balão, e outro toque, um toque fora ou Esc fecham. Isso vale para os subtítulos das páginas, os subtítulos e legendas dos cartões, a ajuda das seções do painel e as dicas dos campos de configuração. Continuam visíveis os números, os destaques ("Para estudar", "O que o painel está vendo"), os estados vazios, os avisos legais curtos e qualquer texto com botão ou link. A página inicial e o relatório para impressão não mudam. Tudo é feito por `assets/js/info.js`, sem mexer nos textos: um texto explicativo novo, escrito no padrão de sempre, já vira "i" sozinho.

### Página inicial

Ordem pensada para conversão (`assets/js/landing.js`): herói com a prévia viva do painel (abas Visão geral, Carteira e Gastos, o patrimônio que sobe ao abrir, a janela que inclina com o mouse e três cartões de vidro flutuando), recursos, simulador do aporte, **Quem cuida do seu planejamento** (foto, texto curto, três pilares, trajetória e botões de contato), **depoimentos**, planos, dúvidas e chamada final. A seção de perfis saiu (o simulador já mostra o perfil).

Os depoimentos ficam num carrossel centrado: o cartão do meio fica em destaque e os vizinhos recuam e esmaecem conforme a rolagem. Ele avança sozinho a cada 7 segundos só quando está visível e ninguém está mexendo, e pausa com toque, mouse, foco ou teclado. Também tem bolinhas, setas, setas do teclado e arraste com o mouse. Com notas preenchidas, aparece a média.

Tudo o que é seu fica em `config.js`:
- `foto`: caminho da foto (hoje `assets/img/nathan.jpg`). A foto fica num quadro com o fundo dela, e o topo da cabeça sai do quadro sobre o fundo do site. Esse recorte vem de `fotoRecorte` (contorno do cabelo, em pixels da foto), `fotoCorte` (altura onde começa o quadro) e `fotoTam` (largura e altura da foto). Trocou a foto? Ajuste esses três ou apague `fotoRecorte` para usar só o quadro. Sem foto, aparecem as iniciais.
- `empresas`: a trajetória (Stone Co., Deloitte, XP Inc.), numa linha discreta de logos, todos na mesma cor chapada (o arquivo vira máscara e a cor vem do tema). Os logos da Deloitte e da XP vieram do Wikimedia Commons, marcados como domínio público; o o logo da XP é desenhado no próprio HTML (`LP_SVG` em `landing.js`, mesmo desenho do arquivo original) com as letras na cor chapada e a forma na cor da marca (`--b2`, azul por padrão e acompanhando o tema Personalizado); o da Stone é o arquivo enviado pelo Nathan (só a palavra, fundo transparente). `caixa` corta a margem vazia do arquivo, `altura` equilibra o tamanho visual, e `cargo` e `periodo` aparecem ao passar o mouse. Sem logo, o nome aparece escrito.
- `depoimentos`: só reais e autorizados. A seção e o link "Depoimentos" no menu aparecem quando houver ao menos um. Campos: `nome` e `texto` (obrigatórios), `destaque` (frase principal, em letra grande), `descricao`, `plano`, `nota` (1 a 5), `data`, `foto`.

## 9. Marca AVEN

O logo é desenhado em código (SVG), sem arquivo de imagem nem fonte externa, e acompanha os temas claro, escuro e OLED. O "A" sem travessa tem uma seta azul (#0A84FF) dentro; no ícone do aplicativo, "A" e "V" aparecem juntos, como duas setas.

- **Nome e subtítulo:** `marca` e `submarca` em `assets/js/config.js` ("AVEN" e "Financial Planning"). Os textos do sistema usam esse nome.
- **Desenho das letras e ícone:** `AVEN_LETRAS`, `AVEN_AZUL`, `LOGO` (ícone quadrado com "AV") e `logoMarca()` (assinatura completa) em `assets/js/ui.js`.
- **Ícone da aba do navegador:** linha `rel="icon"` no `index.html`.
- **Ícone do celular e do app instalado:** `assets/img/apple-touch-icon.png` (180 px), `icon-192.png` e `icon-512.png`, usados pelo `index.html` e pelo `manifest.json`.

O identificador interno dos backups continua `financial-planning`, para que backups antigos sigam sendo aceitos.

## 10. Temas e tom de voz

O **Painel administrativo** abre com o perfil e três grupos (Planejamento; Personalizar o painel; Backup e planilhas). Cada grupo abre a sua própria página, com os títulos recolhíveis. No computador, a setinha ao lado do logo recolhe o menu lateral para só o "AV" e os ícones, e a escolha fica salva no navegador. Na Visão geral, cada widget tem um ícone próprio à esquerda do título; tocar nele leva à aba de origem. O gráfico do patrimônio estimado mostra uma bolinha em cada mês (o mês atual em destaque), pode exibir o ritmo da meta e, no balão, a variação de cada mês; as setas do teclado percorrem os meses. Ao lado do ano, o seletor de período muda a Visão geral inteira (patrimônio, indicadores, gráficos, áreas de gasto e proventos) para os últimos 3 ou 6 meses, o ano todo ou qualquer intervalo escolhido num calendário de meses. A composição da carteira aparece compacta e abre completa no botão de expandir.

No grupo **Personalizar o painel** (junto com Telas e Abas do menu):

- **Tema:** chave **Automático** (Claro de dia, escuro à noite, conforme o aparelho) e as opções Claro, Dark OLED ou **Personalizado** (o cliente escolhe o fundo, claro ou escuro, e uma de oito cores de destaque; o contraste do texto sobre a cor é calculado em `prefs.js`). O Midnight Blue saiu: quem usava passa para o Dark OLED. Todos usam vidro e gradientes da marca (detalhes em `DESIGN.md`). Aplicado antes da tela carregar, sem piscar.
- **Voz:** Consultivo, Direto ou Acolhedor, cada um com uma linha curta do tom. A voz também escolhe o visual do card do objetivo na Visão geral: Consultivo com a foto do objetivo, Direto sem foto (visual limpo, nas cores do tema escolhido) e Acolhedor com um objeto 3D do objetivo (alianças, carro, casa, avião, blocos de dinheiro...), que gira com o mouse. Sem suporte a 3D no aparelho, aparece a foto. Quem usava a voz Executivo passou para Direto. O título da Visão geral também conversa: muda conforme a situação (orçamento, objetivo, aportes, fim do mês, dia da semana). São centenas de variações que usam o nome, a hora, o dia, a época do ano e os números do cliente, sem repetir a frase anterior. Na voz Acolhedor ele apaga e digita uma frase nova a cada 45 a 60 segundos; nas outras, troca quando o cliente volta para a tela. Muda os textos de orientação e os alertas financeiros (orçamento, poupança, aporte, desvio da carteira). Os números nunca mudam, só a forma de dizer.

A escolha fica salva no perfil do cliente. O sistema respeita a preferência de reduzir animações do dispositivo.

### Sem internet

O site guarda os próprios arquivos no aparelho (`sw.js`) e abre mesmo sem conexão. Os dados continuam vindo do banco: sem internet, quem usa a conta de verdade vê a tela "Sem conexão" com o botão para tentar de novo, em vez do erro do navegador.

### Olho oculto

O botão do olho, ao lado do sino, esconde todos os valores em reais do painel ("R$ ••••"), como nos aplicativos de banco. Percentuais, pontos percentuais, datas e o formato dos gráficos continuam visíveis. Os eixos dos gráficos, os avisos da central e o relatório também ficam ocultos. A escolha fica salva no aparelho: quem fecha o olho no celular reabre o app com os valores escondidos. A página inicial não muda. Para imprimir o relatório com valores, abra o olho antes.

## 11. Fluxo de cobrança e ativação

O site **não processa pagamentos**. O fluxo é:

1. O cliente se cadastra, faz o diagnóstico e escolhe o plano. O pedido aparece para você na aba **Clientes** ("Solicitou").
2. Ele paga pelo seu link (`paymentUrl`) e envia o comprovante por WhatsApp ou e-mail.
3. Você confirma o pagamento e, na aba **Clientes**, troca o plano dele (Organização, Investidor ou Assessoria). Só você consegue fazer essa troca (regra do banco).

Para automatizar (pagamento aprova, plano libera sozinho), crie uma Edge Function que receba o webhook do seu meio de pagamento e grave em `assinaturas` com a chave `service_role`. Isso fica fora deste pacote.

## 12. Publicar no GitHub Pages

1. Crie um repositório e envie estes arquivos (`git init`, `git add .`, `git commit`, `git push`).
2. No repositório: **Settings > Pages > Build and deployment > Deploy from a branch > main / (root)**.
3. Em alguns minutos o site estará em `https://seu-usuario.github.io/nome-do-repositorio/`. Domínio próprio: Settings > Pages > Custom domain.

## 13. Privacidade e LGPD

- Cada cliente só lê e grava os próprios dados (RLS).
- Com o plano **Organização** ou **Investidor**, você, como consultor, enxerga apenas nome, contato, plano e o resultado do diagnóstico. Com a **Assessoria** ativa, você passa a ver o planejamento do cliente (para montar a carteira recomendada e o relatório). Deixe isso claro na contratação.
- O texto de "Termos e privacidade" (`assets/js/ui.js`, função `openTerms`) é genérico: **revise com seu jurídico/compliance** antes de divulgar, incluindo o tratamento de dados por IA, as frases de aviso da página inicial e a comunicação de assessoria de investimentos.
- O questionário de perfil é simplificado e não substitui a análise de adequação (suitability).

## 14. Backup e importação de planilha

- **Backup completo** (Painel administrativo): baixa um único arquivo `.json` com perfil, todos os anos, rendas, gastos, lançamentos, ativos e carteira. **Restaurar backup** recoloca tudo (também lê backups de versões anteriores).
- **Importar planilha (.xlsx):** o Painel traz o modelo para baixar. Recurso dos planos Investidor e Assessoria.

## 15. Testes

```bash
npm install
npm test
```

Cobrem o motor de cálculo (parcelas, orçamento, lançamentos reais, permissões por plano) e a ingestão (CSV, OFX, codificações, categorização, duplicidade, conciliação, validação da resposta de IA).

## 16. Bibliotecas externas (carregadas por CDN)

`@supabase/supabase-js` 2.45.4 (jsDelivr, só quando o Supabase está configurado), `xlsx` 0.18.5 (cdnjs, só ao usar a importação de planilha) e a fonte Inter (Google Fonts, opcional). Para não depender de CDN, baixe os arquivos e aponte os endereços em `assets/js/store.js`, `assets/js/admin.js` e `index.html`.

## 17. Limitações conhecidas

- A integração com o Supabase foi testada com um **simulador** do serviço, não com um projeto real. A Edge Function é um modelo que **não foi executada** contra a API de IA. Faça o roteiro do item 2, um cadastro de teste e um PDF de teste antes de divulgar.
- Importação: a categorização por regras acerta os casos comuns, mas cada banco tem seu formato. Linhas de baixa confiança vão para "Revisar" e o cliente confere antes de confirmar. PDF só é lido com a IA ligada.
- Sem autenticação em dois fatores (o Supabase oferece MFA; precisa ser ligado e ter tela própria).
- Sem webhook de pagamento (item 11) e sem cotações de mercado: o patrimônio é calculado a custo (patrimônio informado mais aportes) e, na Carteira, o cliente pode digitar o valor atual de cada ativo.
- Dois dispositivos editando o mesmo ano ao mesmo tempo: vale o último salvamento.
