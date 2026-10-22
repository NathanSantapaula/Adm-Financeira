/* privacidade.html: desenha a política (politica.js) com os dados de config.js. Fica em arquivo próprio porque a página não permite script embutido (CSP). */
'use strict';
(function () {
  const cfg = window.FP_CONFIG || {};
  document.getElementById('marca').textContent = [cfg.marca, cfg.submarca].filter(Boolean).join(' · ');
  document.getElementById('politica').innerHTML = politicaHtml(cfg, true);
})();
