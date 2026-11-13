/* Importação inteligente, varrida pela rolagem como o resto da página.
   O extrato entra, o cursor o arrasta até a AVEN, um scanner lê linha por linha, cada linha salta para
   a prévia e ganha a categoria, você confere (duplicado e fatura ficam de fora) e importa.
   Tudo é desenhado numa prancheta de tamanho fixo (uma para o computador, outra para o celular) e escalado. */
(() => {
  'use strict';
  const sec = document.querySelector('.ix'), motion = window.AvenScroll;
  if (!sec || !motion) return;
  const $ = (q) => sec.querySelector(q), $$ = (q) => [...sec.querySelectorAll(q)];
  const stage = $('.ix-stage'), palco = $('[data-ix-palco]'), art = $('[data-ix-art]'), app = $('[data-ix-app]'), doc = $('[data-ix-doc]');
  const solta = $('[data-ix-solta]'), scan = $('[data-ix-scan]'), cursor = $('[data-ix-cursor]'), btn = $('[data-ix-btn]'), ok = $('[data-ix-ok]'), arq = $('[data-ix-arq]');
  const rows = $$('[data-ix-row]'), cards = $$('[data-ix-card]'), passos = $$('[data-ix-passo]'), leg = $('[data-ix-leg]'), legT = $('[data-ix-leg-t]'), legS = $('[data-ix-leg-s]');
  const header = document.querySelector('.header'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n) => Math.max(0, Math.min(1, n)), range = (n, a, b) => clamp((n - a) / (b - a)), ease = (n) => n * n * (3 - 2 * n), mix = (a, b, t) => a + (b - a) * t;
  const back = (n) => { const c = 1.7; return 1 + (c + 1) * Math.pow(n - 1, 3) + c * Math.pow(n - 1, 2); };
  const LEG = [['Arraste o extrato.', 'Do jeito que o banco manda: OFX, CSV ou planilha.'], ['Cada linha no lugar certo.', 'Categoria, renda ou gasto e o que se repete, em segundos.'], ['Você confere.', 'Duplicado e pagamento de fatura ficam de fora. Nada entra sem o seu ok.'], ['Pronto, está no seu mês.', 'Sem digitar uma linha.']];
  const OK = [true, true, true, false, true, false];
  /* Pranchetas. doc0: onde o extrato descansa; doc1: dentro da AVEN, já menor. */
  const L = {
    pc: { W: 1000, H: 560, app: [520, 0, 480, 560], doc0: [60, 28, 360, 504, -5], doc1: [632, 84, 252, 353, 0], leg: [40, 150, 400], lista: [540, 76, 440, 52, 8], btn: [540, 470, 440, 50] },
    cel: { W: 360, H: 572, app: [0, 160, 360, 412], doc0: [40, 0, 280, 392, -4], doc1: [70, 244, 220, 308, 0], leg: [10, 14, 340], lista: [12, 244, 336, 41, 6], btn: [12, 526, 336, 38] },
  };
  // Linhas da tabela do PDF: onde começam e a altura de cada uma (iguais ao CSS).
  const R0 = 168, RH = 36;
  let lay = L.pc, enabled = false, hh = 79, dist = 1;
  const px = (el, [x, y, w, h]) => Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, ...(h ? { height: `${h}px` } : {}) });
  function measure() {
    lay = innerWidth < 760 ? L.cel : L.pc;
    sec.dataset.lay = lay === L.cel ? 'cel' : 'pc';
    enabled = motion.storyFits(motion.viewport());
    sec.classList.toggle('is-animated', enabled);
    art.style.width = `${lay.W}px`; art.style.height = `${lay.H}px`;
    px(app, lay.app);
    const [lx, ly, lw] = lay.leg; Object.assign(leg.style, { left: `${lx}px`, top: `${ly}px`, width: `${lw}px` });
    const [cx, cy, cw, ch, cg] = lay.lista;
    // Os cartões, o resumo e a área de soltar ficam dentro da AVEN: posição relativa a ela.
    const ox = cx - lay.app[0], oy = cy - lay.app[1];
    cards.forEach((c, i) => px(c, [ox, oy + i * (ch + cg), cw, ch]));
    px(btn, [lay.btn[0] - lay.app[0], lay.btn[1] - lay.app[1], lay.btn[2], lay.btn[3]]);
    px(ok, [ox, oy, cw, 6 * (ch + cg) - cg]);
    px(solta, [ox, oy, cw, 6 * (ch + cg) - cg]);
    const [, , dw, dh] = lay.doc0; doc.style.width = `${dw}px`; doc.style.height = `${dh}px`;
    // Escala da prancheta para caber no palco.
    const r = palco.getBoundingClientRect(), s = Math.min(r.width / lay.W, (enabled ? r.height : lay.H * 2) / lay.H, 1.25);
    art.style.transform = `scale(${s})`; art.style.marginLeft = `${(r.width - lay.W * s) / 2}px`;
    palco.style.height = enabled ? '' : `${lay.H * s}px`;
    hh = header.getBoundingClientRect().height; dist = Math.max(1, sec.offsetHeight - stage.offsetHeight);
    render();
  }
  function render() {
    // O início é medido a cada quadro: as cenas de cima mudam de altura depois que esta mede.
    const start = sec.getBoundingClientRect().top + window.scrollY - hh;
    const p = enabled ? clamp((motion.read() - start) / dist) : 1;
    const [ax, ay] = lay.app, [d0x, d0y, d0w, , d0r] = lay.doc0, [d1x, d1y, d1w] = lay.doc1, k1 = d1w / d0w;
    // 1. O extrato entra girando de baixo (0 a .14) e é arrastado até a AVEN (.18 a .36).
    const entra = back(range(p, 0, .14)), arrasta = ease(range(p, .18, .36));
    const pega = range(p, .14, .18), solto = range(p, .36, .4);
    // O papel gira e escala a partir do canto de cima, então a posição é sempre a do canto.
    const x = mix(d0x, d1x, arrasta), y = mix(d0y + 520 * (1 - entra), d1y, arrasta), dh = lay.doc0[3];
    const lift = Math.sin(arrasta * Math.PI) * 26;
    const k = mix(1, k1, arrasta) * (1 + .04 * Math.min(pega, 1 - solto) * (arrasta < 1 ? 1 : 0));
    const r = mix(d0r - 10 * (1 - entra), 0, arrasta) + Math.sin(arrasta * Math.PI) * 5;
    // 3. Depois de lido, o extrato vira o selo do arquivo no topo (.62 a .68).
    // Lido o papel, ele se dobra e voa para o selo do arquivo, no topo da AVEN.
    const some = ease(range(p, .64, .7));
    // Arrastado, o papel inclina em perspectiva, como uma folha de verdade na mão.
    const voo = Math.sin(arrasta * Math.PI);
    const tx = ax + lay.app[2] - 150, ty = ay + 22, dx0 = mix(x, tx, some), dy0 = mix(y - lift, ty, some);
    doc.style.transform = `translate(${dx0}px, ${dy0}px) rotate(${r - 10 * some}deg) perspective(1200px) rotateX(${8 * voo + 50 * some}deg) rotateY(${-14 * voo}deg) scale(${k * mix(1, .07, some)})`;
    doc.style.opacity = String(Math.min(range(p, 0, .03), 1 - range(p, .67, .7)));
    doc.style.boxShadow = `0 ${18 + lift}px ${40 + lift * 2}px -12px #0007`;
    // A área de soltar acende quando o extrato chega perto e some quando ele cai.
    const perto = ease(range(p, .26, .36));
    solta.style.opacity = String(1 - ease(range(p, .36, .4)));
    solta.classList.toggle('quente', perto > .3 && p < .4);
    solta.style.transform = `scale(${1 + .03 * perto})`;
    // 2. Scanner (.4 a .58): uma faixa de luz desce; cada linha acende ao ser lida.
    const lendo = range(p, .4, .58);
    scan.style.opacity = String(lendo > 0 && lendo < 1 ? 1 : 0);
    scan.style.top = `${mix(30, 90, lendo)}%`;
    doc.classList.toggle('lendo', lendo > 0 && lendo < 1);
    rows.forEach((row, i) => {
      const lida = lendo > 0 && mix(30, 90, lendo) / 100 * dh > R0 + i * RH + RH / 2;
      row.classList.toggle('lida', lida);
      // a linha some do papel quando o cartão dela salta para a prévia
      row.style.opacity = String(1 - range(p, .56 + i * .013, .58 + i * .013));
    });
    // Cartões: cada um sai da posição da sua linha no papel e cai na lista (.58 a .7).
    const [cx, cy, cw, ch, cg] = lay.lista;
    cards.forEach((c, i) => {
      const t = range(p, .56 + i * .013, .61 + i * .013), e = back(t);
      const rx = x + 22 * k, ry = y - lift + k * (R0 + i * RH), sy = cy + i * (ch + cg);
      const dx = (rx - cx) * (1 - e), dy = (ry - sy) * (1 - e) - Math.sin(t * Math.PI) * 24;
      const sc = mix(k * (d0w - 44) / cw, 1, e);
      const conf = range(p, .72 + i * .018, .74 + i * .018), feito = ease(range(p, .86, .9));
      c.style.opacity = String(t > 0 ? 1 - feito : 0);
      c.style.transform = `translate(${dx}px, ${dy + feito * -16}px) scale(${sc})`;
      c.classList.toggle('cat', t >= 1);
      c.classList.toggle('conf', conf >= 1);
      c.classList.toggle('fora', conf >= 1 && !OK[i]);
    });
    arq.classList.toggle('on', p >= .69);
    // 4. O botão aparece, é tocado (.82) e a prévia vira o resumo (.86 a .92).
    const bt = back(range(p, .76, .8)), aperta = Math.sin(range(p, .82, .86) * Math.PI);
    btn.style.opacity = String(Math.min(range(p, .76, .78), 1 - ease(range(p, .86, .9))));
    btn.style.transform = `translateY(${(1 - bt) * 24}px) scale(${1 - .06 * aperta})`;
    const fim = back(range(p, .88, .94));
    ok.style.opacity = String(range(p, .88, .9)); ok.style.transform = `scale(${mix(.86, 1, fim)})`; ok.classList.toggle('on', p >= .94);
    // Cursor: entra, pega o papel, arrasta, solta; volta para tocar no botão.
    let cxp, cyp, cop = 0, toque = 0;
    const pegaX = x + d0w * k * .62, pegaY = y - lift + 40 * k;
    if (p < .4) { const ch0 = ease(range(p, .08, .16)); cxp = mix(lay.W * .48, pegaX, ch0); cyp = mix(lay.H + 30, pegaY, ch0); cop = range(p, .08, .11) * (1 - range(p, .38, .42)); toque = arrasta > 0 && arrasta < 1 ? 1 : pega * (1 - solto); }
    else { const vai = ease(range(p, .74, .82)); const [bx, by, bw, bh] = lay.btn; cxp = mix(lay.W * .72, bx + bw * .62, vai); cyp = mix(lay.H + 30, by + bh * .55, vai); cop = range(p, .74, .76) * (1 - range(p, .9, .93)); toque = aperta; }
    cursor.style.transform = `translate(${cxp - 5}px, ${cyp - 3}px) scale(${1 - .12 * toque})`;
    cursor.style.opacity = String(cop); cursor.classList.toggle('pega', toque > .5);
    // Legenda grande e as etapas.
    const passo = p < .4 ? 0 : p < .7 ? 1 : p < .88 ? 2 : 3;
    passos.forEach((el, i) => { el.classList.toggle('on', i === passo); el.classList.toggle('feito', i < passo); });
    if (legT.dataset.i !== String(passo)) { legT.dataset.i = String(passo); legT.textContent = LEG[passo][0]; legS.textContent = LEG[passo][1]; leg.classList.remove('troca'); void leg.offsetWidth; leg.classList.add('troca'); }
    // No celular a legenda divide o alto da prancheta com o papel: só aparece depois que ele sai.
    // A legenda divide espaço com o papel: só aparece depois que ele vai para a AVEN.
    leg.style.opacity = String(range(p, .34, .4));
  }
  motion.subscribe(render);
  addEventListener('resize', measure);
  reduced.addEventListener('change', measure);
  new ResizeObserver(() => measure()).observe(palco);
  measure();
})();
