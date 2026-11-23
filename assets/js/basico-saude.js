/* Saúde financeira, refeita no padrão azul: o Cifrão vira holograma, passa o scanner por cada indicador da própria página, acende o anel e carimba a nota */
const BAS_SDN = {
  curto: { reserva: 'Reserva', poupanca: 'Sobra', fixos: 'Fixos', sonho: 'Sonho' },
  curta: {
    reserva: { ok: 'Cobre imprevistos com folga.', atencao: 'Complete antes de arriscar.', baixo: 'Separe um valor fixo por mês.' },
    poupanca: { ok: 'Bom hábito. Mantenha.', atencao: 'Veja o que mais cresceu nos gastos.', baixo: 'Um limite por categoria ajuda.' },
    fixos: { ok: 'Sobra espaço para o resto.', atencao: 'Reveja assinaturas e parcelas.', baixo: 'Renegociar uma conta libera fôlego.' },
    sonho: { ok: 'No ritmo certo.', atencao: 'O simulador mostra quanto a mais.', baixo: 'Reveja valor, prazo ou aporte.' },
  },
  nome: { reserva: 'Reserva', poupanca: 'Sobra do ano', fixos: 'Contas fixas', sonho: 'Sonho principal' },
  meta: { reserva: 'Meta: 6 meses de gastos', poupanca: 'Meta: 20% do que entra', fixos: 'Ideal: até 50% da renda', sonho: 'Meta: chegar no prazo' },
  forma: { reserva: 'cadeado', poupanca: 'moeda', fixos: 'seta', sonho: 'mais' },
  nota: { ok: 1, atencao: 0.6, baixo: 0.25 },
  selo: (n) => (n == null ? 'Sem dados' : n >= 80 ? 'Saudável' : n >= 60 ? 'No caminho' : 'Pede cuidado'),
};
// arco de 84° do quadrante i (começa no topo, sentido horário), preenchido até a fração f
const basSdnArco = (i, f) => { const a0 = (-90 + i * 90 + 3) * Math.PI / 180; const a1 = a0 + (84 * Math.max(0.02, f)) * Math.PI / 180; const p = (a) => `${(100 + 88 * Math.cos(a)).toFixed(2)} ${(100 + 88 * Math.sin(a)).toFixed(2)}`;
  return `M${p(a0)}A88 88 0 0 1 ${p(a1)}`; };
// a nota e o que cada indicador tira dela (a nota é a média dos indicadores medidos); usado pela tela e pelo widget do Início
function basSdnDados() {
  const ult = S.year === NOW_Y ? NOW_M : 11; const H = basSaude(ult); const N = BAS_SDN;
  const metaF = { reserva: (x) => Math.min(1, (x.valor || 0) / 6), poupanca: (x) => Math.min(1, Math.max(0, (x.valor || 0) / 0.3)), fixos: (x) => Math.min(1, Math.max(0, 1 - (x.valor || 0))), sonho: (x) => Math.min(1, x.valor || 0) };
  const itens = H.itens.map((x) => { const n = x.nota != null ? x.nota : N.nota[x.sit]; return { ...x, n: n == null ? null : n, f: x.valor == null ? 0 : x.sit === 'ok' ? 1 : metaF[x.id](x) }; });
  const med = itens.filter((x) => x.n != null).length; itens.forEach((x) => { x.perde = x.n == null || !med ? 0 : Math.round(((1 - x.n) * 100) / med); });
  const foco = itens.filter((x) => x.perde > 0).sort((a, b) => b.perde - a.perde)[0];
  const nivel = H.nota == null ? 'sem' : H.nota >= 80 ? 'ok' : H.nota >= 60 ? 'atencao' : 'baixo';
  // veredito curto (cabe numa linha): o nível e quantos pontos pedem atenção
  const nAt = itens.filter((x) => x.sit === 'atencao' || x.sit === 'baixo').length; const pts = `${nAt} ${nAt === 1 ? 'ponto' : 'pontos'}`;
  const titulo = H.nota == null ? 'Sem nota ainda' : H.nota >= 80 ? 'Base sólida' : H.nota >= 60 ? 'Bom caminho' : 'Base frágil';
  const sub = H.nota == null ? 'Anote o mês para medir' : !nAt ? 'tudo em dia' : H.nota >= 60 ? `${pts} de atenção` : `${pts} a cuidar`;
  return { ult, H, itens, foco, nivel, titulo, sub };
}
function basTelaSaudeNova() {
  const { ult, H, itens, foco, nivel, titulo, sub } = basSdnDados(); const N = BAS_SDN;
  const val = { reserva: (x) => `${x.valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<small> ${x.valor === 1 ? 'mês' : 'meses'}</small>`, poupanca: (x) => pct(x.valor), fixos: (x) => pct(x.valor), sonho: (x) => pct(x.valor) };
  const ir = { reserva: 'data-act="bas-aba" data-v="investir"', poupanca: 'data-act="bas-aba" data-v="gastos"', fixos: 'data-act="bas-aba" data-v="gastos"', sonho: basIr('sonhos') };
  const ant = ult > 0 && H.nota != null ? basSaude(ult - 1).nota : null; const dif = ant == null ? null : H.nota - ant;
  const frase = H.nota == null ? sub : `${titulo} · ${sub}`;
  const topo = `<div class="bas-sdn ${nivel}" data-nota="${H.nota == null ? '' : H.nota}" data-frase="${esc(frase)}">
    <button class="bas-sdn-holo" type="button" data-sdn-re aria-label="Analisar de novo">
      <svg class="bas-sdn-anel" viewBox="0 0 200 200" aria-hidden="true">${itens.map((x, i) => `<path class="tr" d="${basSdnArco(i, 1)}"/><path class="v ${x.sit}" data-k="${i}" d="${basSdnArco(i, x.f)}"/>`).join('')}</svg>
      <span class="bas-sdn-cone" aria-hidden="true"></span><span class="bas-sdn-base" aria-hidden="true"></span>
      <span class="bas-sdn-cif" aria-hidden="true"><span class="cifrao" data-sem-giro></span></span><span class="bas-sdn-linha" aria-hidden="true"></span>
    </button>
    <div class="bas-sdn-nota">${H.nota == null ? '<b class="vz">Sem nota</b>' : `<b data-sdn-n>${H.nota}</b><small>de 100</small>`}<span class="bas-sdn-selo">${N.selo(H.nota)}</span></div>
    <div class="bas-sdn-ts">${itens.map((x, i) => `<button class="bas-sdn-t ${x.sit}" ${ir[x.id]} data-sdn-i="${x.id}" style="--i:${i}"><span class="bas-sdn-scan" aria-hidden="true"></span><small>${N.curto[x.id]}</small><b>${x.valor == null ? '–' : val[x.id](x)}</b><span class="bas-sdn-g" aria-hidden="true"><i style="--f:${(x.id === 'fixos' ? Math.min(1, x.valor || 0) : x.f).toFixed(3)}"></i></span></button>`).join('')}</div>
    <p class="bas-sdn-st" aria-live="polite">${esc(frase)}</p>
    ${dif == null ? '' : `<small class="bas-sdn-evo">${dif === 0 ? `Igual a ${MES_LONGO[ult - 1]}` : `${dif > 0 ? '▲' : '▼'} ${Math.abs(dif)} ${Math.abs(dif) === 1 ? 'ponto' : 'pontos'} desde ${MES_LONGO[ult - 1]}`}</small>`}
  </div>`;
  const dica = (x) => (x.sit === 'sem' ? 'Anote entradas e gastos para medir.' : (BAS_SD_DICA[x.id] || {})[x.sit] || '');
  const focoHtml = H.nota == null ? `<button class="card bas-sdn-foco" data-act="bas-aba" data-v="gastos"><small class="bas-sdn-k">Comece por aqui</small><b>Anote o mês</b><span>${esc(voz('bas_vazio'))}</span><span class="bas-sd-ver">Anotar agora ${I.chev}</span></button>`
    : foco ? `<button class="card bas-sdn-foco ${foco.sit}" ${ir[foco.id]}><small class="bas-sdn-k">Comece por aqui</small><b>${N.nome[foco.id]}</b><em>+${foco.perde} ${foco.perde === 1 ? 'ponto' : 'pontos'} na nota se ficar em dia</em><span>${esc(dica(foco))}</span><span class="bas-sd-ver">Agir agora ${I.chev}</span></button>`
    : `<div class="card bas-sdn-foco ok"><small class="bas-sdn-k">Tudo em dia</small><b>Nota cheia</b><span>Os quatro indicadores estão na meta. O que sobrar pode ir para objetivos de prazo maior.</span></div>`;
  const linha = (x, i) => `<button class="card bas-sdn-i ${x.sit}" ${ir[x.id]} style="--i:${i}"><span class="bas-sdn-ih"><b>${N.nome[x.id]}</b><em>${BAS_SIT[x.sit]}</em></span>
    <span class="bas-sdn-iv"><b>${x.valor == null ? '–' : val[x.id](x)}</b><span class="bas-sdn-p">${x.n == null ? '' : x.perde ? `−${x.perde} ${x.perde === 1 ? 'ponto' : 'pontos'}` : 'Na meta'}</span>${I.chev}</span>
    <span class="bas-sdn-d">${x.sit === 'sem' ? 'Anote o mês para medir.' : N.curta[x.id][x.sit]}</span></button>`;
  const folha = `${focoHtml}<h2 class="bas-h2 bas-sdn-h">Ponto a ponto</h2><div class="bas-sdn-l">${itens.map(linha).join('')}</div>
    <p class="bas-sdn-disc">Média dos indicadores com dados · não é recomendação.</p>`;
  return basPgAzul('bas-pg-sdn', 'Saúde financeira', topo, folha);
}
BAS_TELAS.saude = basTelaSaudeNova;

// widget do Início: mini holograma (anel dos 4 indicadores com o Cifrão), a nota com o selo e o que fazer primeiro
function basWidgetSaude() {
  const { H, itens, nivel, titulo, sub } = basSdnDados();
  return `<button class="card bas-w-sdn ${nivel}" ${basIr('saude')}>
    <span class="bas-w-sdn-r" aria-hidden="true"><svg viewBox="0 0 200 200">${itens.map((x, i) => `<path class="tr" d="${basSdnArco(i, 1)}"/><path class="v ${x.sit}" d="${basSdnArco(i, x.f)}"/>`).join('')}</svg><b>${H.nota == null ? '–' : H.nota}</b></span>
    <span class="bas-w-sdn-t"><small>Saúde financeira</small><b>${titulo}</b><span>${H.nota == null ? sub : cap(sub)}</span></span>${I.chev}</button>`;
}

// a análise: holograma liga, o scanner passa por cada cartão (o Cifrão olha e muda de forma), o anel acende, a nota sobe e o selo carimba
(() => {
  let visto = ''; let vistoEm = 0;
  const liga = (w, forcar) => {
    const pg = w.closest('.bas-pg'); const h = w.querySelector('.cifrao'); const cards = [...pg.querySelectorAll('[data-sdn-i]')]; const segs = [...w.querySelectorAll('.bas-sdn-anel .v')];
    const st = w.querySelector('.bas-sdn-st'); const nEl = w.querySelector('[data-sdn-n]'); const nota = w.dataset.nota === '' ? null : +w.dataset.nota;
    const C = (f) => { try { f(window.Cifrao); } catch (e) { /* Cifrão ainda não montado */ } };
    const olha = (el) => { const r = el.getBoundingClientRect(); h && h.dispatchEvent(new CustomEvent('cifrao:olhar', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } })); };
    const fim = () => { pg.classList.remove('analisa'); w.classList.add('pronto'); w.classList.remove('lendo'); cards.forEach((c) => c.classList.add('lido')); segs.forEach((s) => s.classList.add('on')); st.textContent = w.dataset.frase; if (nEl && nota != null) nEl.textContent = nota; };
    const reage = () => C((K) => { if (!(nota >= 80)) K.forma(h, 'cifrao'); if (nota == null) K.expressao(h, 'confuso'); else if (nota >= 80) { K.expressao(h, 'comemorando'); setTimeout(() => K.forma(h, 'mais'), 900); } else if (nota >= 60) K.expressao(h, 'confiante'); else K.expressao(h, 'carinho'); });
    const sig = `${w.dataset.nota}|${cards.map((c) => c.className).join()}`;
    // re-render da mesma tela (ex.: olho) não repete a análise; tocar no holograma repete
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || (!forcar && sig === visto && Date.now() - vistoEm < 60000)) { fim(); setTimeout(reage, 400); return; }
    visto = sig; vistoEm = Date.now();
    pg.classList.add('analisa'); w.classList.remove('pronto'); w.classList.add('lendo'); cards.forEach((c) => c.classList.remove('lido', 'lendo')); segs.forEach((s) => s.classList.remove('on'));
    if (nEl && nota != null) nEl.textContent = '··';
    const vivo = () => w.isConnected && w.classList.contains('lendo');
    st.textContent = 'Ligando o scanner…'; setTimeout(() => C((K) => K.expressao(h, 'pensando')), 350);
    let k = 0;
    const passo = () => {
      if (!vivo()) return; const c = cards[k]; cards.forEach((o) => o.classList.remove('lendo'));
      if (!c) { st.textContent = 'Somando a nota…'; conta(); return; }
      c.classList.add('lendo'); st.textContent = `Medindo ${BAS_SDN.nome[c.dataset.sdnI].toLowerCase()}…`; olha(c); C((K) => K.forma(h, BAS_SDN.forma[c.dataset.sdnI]));
      setTimeout(() => { if (!vivo()) return; c.classList.add('lido'); segs[k] && segs[k].classList.add('on'); k++; setTimeout(passo, 200); }, 760);
    };
    const conta = () => {
      if (nota == null) { fim(); reage(); return; } const t0 = performance.now();
      const q = (t) => { if (!w.isConnected) return; const p = Math.min(1, (t - t0) / 900); nEl.textContent = Math.round(nota * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(q); else { fim(); reage(); } };
      requestAnimationFrame(q); C((K) => K.expressao(h, 'calculando'));
    };
    setTimeout(passo, 900);
  };
  new MutationObserver(() => document.querySelectorAll('.bas-sdn:not([data-on])').forEach((w) => { w.dataset.on = '1'; liga(w); })).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-sdn-re]'); const w = b && b.closest('.bas-sdn'); if (w && !w.classList.contains('lendo')) liga(w, true); });
})();
