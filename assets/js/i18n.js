/* Idiomas do app. O app é escrito em português; em outro idioma, cada texto que aparece na tela é trocado pela tradução
   (assets/i18n/<código>.json, na mesma ordem de assets/i18n/pt.json). Antes da busca, valores, números e meses viram {0}, {1}…
   e voltam no lugar (o mês já no idioma escolhido). O que não está no dicionário fica em português.
   shortcut: a lista de textos foi colhida das telas do modo demonstração; textos novos entram rodando a coleta de novo e traduzindo. */
'use strict';
const IDIOMAS = [['pt', 'Português (Brasil)'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['it', 'Italiano'], ['nl', 'Nederlands'],
  ['ru', 'Русский'], ['zh', '中文 (简体)'], ['ja', '日本語'], ['ko', '한국어'], ['hi', 'हिन्दी'], ['ar', 'العربية']];
const OLA = { pt: 'Olá', en: 'Hello', es: 'Hola', fr: 'Bonjour', de: 'Hallo', it: 'Ciao', nl: 'Hallo', ru: 'Привет', zh: '你好', ja: 'こんにちは', ko: '안녕하세요', hi: 'नमस्ते', ar: 'مرحبًا' };
const idiomaAtual = () => { try { const v = localStorage.getItem('fp:idioma'); return IDIOMAS.some((x) => x[0] === v) ? v : 'pt'; } catch (e) { return 'pt'; } };
const idiomaNome = (cod, em) => { try { return new Intl.DisplayNames([em || idiomaAtual()], { type: 'language' }).of(cod === 'zh' ? 'zh-Hans' : cod === 'pt' ? 'pt-BR' : cod); } catch (e) { return cod; } };
function trocarIdioma(cod) {
  if (!IDIOMAS.some((x) => x[0] === cod) || cod === idiomaAtual()) return;
  try { localStorage.setItem('fp:idioma', cod); } catch (e) { /* ignora */ }
  location.reload(); // o app inteiro volta já no idioma novo
}
(function () {
  const cod = idiomaAtual(); const h = document.documentElement;
  h.lang = cod === 'pt' ? 'pt-BR' : cod; if (cod === 'ar') h.dir = 'rtl';
  if (cod === 'pt') return;
  const V = '20261204a';
  const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const re = new RegExp('R\\$\\s?[\\d.,]+(?:\\s?(?:mil|mi))?|[+−-]?\\d[\\d.,]*%?|(?<![\\p{L}])(' + MES.join('|') + ')(?![\\p{L}])', 'giu');
  const fmtMes = new Intl.DateTimeFormat(cod, { month: 'long' });
  let D = null; let W = new Map(); let WF = new Map();
  const mesTr = (v) => { const mi = MES.indexOf(v.toLowerCase()); return mi >= 0 ? fmtMes.format(new Date(2024, mi, 1)) : null; };
  // valor que entra no lugar de {n}: mês vai para o idioma; texto tenta a própria tradução; número fica como está
  const valor = (v, prof) => { const m = mesTr(v); if (m) return m; if (prof < 2 && /[A-Za-zÀ-ú]{2}/.test(v)) { const t = busca(v, prof + 1); if (t) return t; } return v; };
  const busca = (s, prof) => {
    const vals = []; const k = s.replace(re, (m) => { vals.push(m); return '{' + (vals.length - 1) + '}'; });
    const tr = D.get(k); if (tr != null) return tr.replace(/\{(\d+)\}/g, (_, i) => valor(vals[+i] || '', 9));
    // moldes com partes variáveis (nomes, frases montadas): achados pela primeira ou pela última palavra
    const pal = s.split(' '); const cs = (W.get(pal[0].toLowerCase()) || []).concat(WF.get(pal[pal.length - 1].toLowerCase()) || []);
    for (const [rx, t] of cs) { const m = s.match(rx); if (m) return t.replace(/\{(\d+)\}/g, (_, i) => valor(m[+i + 1] || '', prof)); }
    const p = s.match(/^([\s·,:.!?—–-]*)(.*?)([\s·,:.!?—–-]*)$/); if (p && (p[1] || p[3]) && p[2].length > 1 && prof < 3) { const t = busca(p[2], prof + 1); if (t) return p[1] + t + p[3]; }
    return null;
  };
  const traduz = (t) => {
    const s = t.replace(/\s+/g, ' ').trim(); if (s.length < 2 || !D) return null;
    const out = busca(s, 0); if (out == null || out === s) return null;
    return t.match(/^\s*/)[0] + out + t.match(/\s*$/)[0];
  };
  const pula = (el) => !el || el.closest('script, style, [translate="no"], textarea, input');
  const texto = (n) => { if (pula(n.parentElement)) return; const t = traduz(n.nodeValue); if (t != null && t !== n.nodeValue) n.nodeValue = t; };
  const ATR = ['aria-label', 'placeholder', 'title'];
  const atributos = (el) => { if (pula(el)) return; for (const a of ATR) { const v = el.getAttribute(a); if (v) { const t = traduz(v); if (t != null && t !== v) el.setAttribute(a, t); } } };
  const anda = (raiz) => {
    if (raiz.nodeType === 3) { texto(raiz); return; } if (raiz.nodeType !== 1) return;
    atributos(raiz); raiz.querySelectorAll('[aria-label], [placeholder], [title]').forEach(atributos);
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) texto(n);
  };
  const liga = () => {
    anda(document.body); if (document.title) { const t = traduz(document.title); if (t) document.title = t; }
    new MutationObserver((ms) => { for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(anda); else if (m.type === 'characterData') texto(m.target); else atributos(m.target);
    } }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR });
  };
  // dicionário guardado no aparelho: a tela já abre traduzida; a cópia nova chega da rede e fica para a próxima vez
  const chave = `fp:i18n:${cod}:${V}`;
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const monta = (pt, tr) => {
    D = new Map(); W = new Map(); WF = new Map();
    pt.forEach((p, i) => { const t = tr[i]; if (!t || t === p) return; D.set(p, t); if (!/\{\d+\}/.test(p)) return;
      const partes = p.split(/\{\d+\}/); const rx = new RegExp('^' + partes.map(esc).join('(.+?)') + '$');
      const ini = partes[0].trim().split(' ')[0].toLowerCase(); const fim = partes[partes.length - 1].trim().split(' ').pop().toLowerCase();
      if (ini) (W.get(ini) || W.set(ini, []).get(ini)).push([rx, t]); else if (fim) (WF.get(fim) || WF.set(fim, []).get(fim)).push([rx, t]); });
  };
  try { const c = JSON.parse(localStorage.getItem(chave) || 'null'); if (c) monta(c[0], c[1]); } catch (e) { /* ignora */ }
  const pronto = () => (document.body ? liga() : document.addEventListener('DOMContentLoaded', liga));
  if (D) pronto();
  Promise.all(['pt', cod].map((c) => fetch(`assets/i18n/${c}.json?v=${V}`).then((r) => r.json()))).then(([pt, tr]) => {
    const tinha = !!D; monta(pt, tr); try { localStorage.setItem(chave, JSON.stringify([pt, tr])); } catch (e) { /* ignora */ }
    if (!tinha) pronto();
  }).catch(() => { /* sem dicionário, fica em português */ });
})();
