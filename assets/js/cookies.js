/* Aviso de cookies e armazenamento. Recusar tem o mesmo peso que aceitar (ANPD).
   Hoje o app não usa cookies opcionais: o armazenamento é só o essencial (sessão e preferências).
   Cookie opcional futuro: só carregar se cookiesPermitido('opcional') for true. */
(() => {
  const CHAVE = 'fp:cookies';
  const lido = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const grava = (v) => { try { localStorage.setItem(CHAVE, v); } catch (e) { /* sem armazenamento: o aviso volta na próxima visita */ } };
  window.cookiesPermitido = (cat) => cat === 'essencial' || lido() === 'todos';
  const mostra = () => {
    if (lido()) return;
    const b = document.createElement('section');
    b.className = 'ck'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Aviso de cookies');
    b.innerHTML = '<p><b>Cookies e armazenamento.</b> Usamos o navegador só para o essencial: manter você conectado e lembrar suas preferências. Não usamos cookies de publicidade. Se um dia usarmos cookies opcionais, pedimos sua permissão antes. <a href="privacidade.html">Política de privacidade</a></p>'
      + '<div class="ck-b"><button type="button" class="btn" data-ck="essencial">Só o essencial</button><button type="button" class="btn primary" data-ck="todos">Aceitar</button></div>';
    b.addEventListener('click', (e) => { const k = e.target.closest('[data-ck]'); if (!k) return; grava(k.dataset.ck); b.remove(); });
    document.body.appendChild(b);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostra); else mostra();
})();
