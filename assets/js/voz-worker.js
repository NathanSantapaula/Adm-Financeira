/* Voz neural do Cifrão, fora da tela principal (assim a animação não trava enquanto a voz é gerada).
   Modelo Piper pt_BR-faber-medium (licença do modelo: ver rhasspy/piper-voices), rodando no aparelho com onnxruntime-web.
   O modelo (~63 MB) é baixado uma vez e fica guardado no Cache do navegador; nenhum texto sai do aparelho.
   Mensagens: { tipo: 'preparar' } → 'prog' { p } ... 'pronto' | 'erro';  { tipo: 'falar', id, frases } → 'audio' { id, i, pcm, sr } ... 'fim' { id }. */
'use strict';
const ORT = 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/';
const FON = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize';
const COLA = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/dist/piper-DeOu3H9E.js';
const MODELO = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx';
const CACHE = 'cifrao-voz-v1';
let sess = null; let cfg = null; let prep = null; let cola = null;

async function baixar(url, prog) {
  let c = null;
  try { c = await caches.open(CACHE); const r = await c.match(url); if (r) return await r.arrayBuffer(); } catch (e) { c = null; } // sem Cache (modo privado): baixa sempre
  const r = await fetch(url); if (!r.ok) throw new Error('download ' + r.status);
  const tot = +r.headers.get('content-length') || 63e6; const rd = r.body.getReader(); const partes = []; let n = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; partes.push(value); n += value.length; if (prog) prog(Math.min(0.99, n / tot)); }
  const b = new Blob(partes); if (c) { try { await c.put(url, new Response(b)); } catch (e) { /* sem espaço: segue sem guardar */ } }
  return await b.arrayBuffer();
}
function preparar() {
  if (prep) return prep;
  prep = (async () => {
    importScripts(ORT + 'ort.min.js');
    ort.env.wasm.wasmPaths = ORT; ort.env.wasm.numThreads = 1; // sem crossOriginIsolated não há threads
    cola = await import(COLA);
    cfg = JSON.parse(new TextDecoder().decode(await baixar(MODELO + '.json')));
    sess = await ort.InferenceSession.create(await baixar(MODELO, (p) => postMessage({ tipo: 'prog', p })), { executionProviders: ['wasm'] });
  })();
  prep.catch(() => { prep = null; });
  return prep;
}
// fonemas de todas as frases de uma vez (o piper_phonemize escreve uma linha de JSON por frase)
function fonemas(frases) {
  return new Promise((ok, erro) => {
    const out = []; const t = setTimeout(() => erro(new Error('fonemas')), 20000);
    cola.createPiperPhonemize({
      print: (l) => { try { out.push(JSON.parse(l).phoneme_ids); } catch (e) { return; } if (out.length === frases.length) { clearTimeout(t); ok(out); } },
      printErr: () => {},
      locateFile: (l) => (l.endsWith('.wasm') ? FON + '.wasm' : l.endsWith('.data') ? FON + '.data' : l),
    }).then((m) => m.callMain(['-l', cfg.espeak.voice, '--input', JSON.stringify(frases.map((text) => ({ text }))), '--espeak_data', '/espeak-ng-data'])).catch((e) => { clearTimeout(t); erro(e); });
  });
}
let atual = 0; let fila = Promise.resolve(); // uma fala por vez na sessão (a anterior para na próxima frase)
onmessage = (e) => {
  const d = e.data || {};
  if (d.tipo === 'parar') { atual = -1; return; }
  if (d.tipo === 'falar') atual = d.id;
  fila = fila.then(() => trabalhar(d));
};
async function trabalhar(d) {
  try {
    await preparar();
    if (d.tipo === 'preparar') { postMessage({ tipo: 'pronto' }); return; }
    if (d.tipo !== 'falar') return;
    if (atual !== d.id) return; const ids = await fonemas(d.frases); const inf = cfg.inference;
    for (let i = 0; i < ids.length; i++) {
      if (atual !== d.id) return; // a fala foi interrompida
      const x = ids[i]; const big = BigInt64Array.from(x, (v) => BigInt(v));
      const r = await sess.run({ input: new ort.Tensor('int64', big, [1, x.length]), input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(x.length)]), [1]),
        scales: new ort.Tensor('float32', Float32Array.from([inf.noise_scale, inf.length_scale * 0.96, inf.noise_w]), [3]) }); // um pouco mais ágil que o padrão
      const pcm = r.output.data; postMessage({ tipo: 'audio', id: d.id, i, pcm, sr: cfg.audio.sample_rate }, [pcm.buffer]);
    }
    postMessage({ tipo: 'fim', id: d.id });
  } catch (err) { postMessage({ tipo: 'erro', id: d.id, msg: String((err && err.message) || err) }); }
}
