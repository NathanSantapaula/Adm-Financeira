/* Registra o service worker (rede primeiro, cache só para uso sem internet). */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
