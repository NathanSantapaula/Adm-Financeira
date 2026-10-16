# Vídeo de lançamento (20 s)

Fonte editável do filme de lançamento do AVEN, feito com a skill motionmaxxing.
Não faz parte do site: nada aqui é carregado pelo `index.html` da raiz.

- `aven-lancamento-20s.mp4`: versão final, 1920×1080, 30 fps, sem som.
- `index.html`: o filme em HTML (cada quadro é função do tempo; aberto no navegador mostra o quadro inicial).
- `STORYBOARD.md`: ideia e storyboard aprovados. `NOTE.md`: nota de entrega com as verificações.
- `runtime/`: motor de animação da skill motionmaxxing (Apache-2.0, ver `runtime/LICENSE`), GSAP 3.12.5 e a fonte Inter (SIL OFL, ver `runtime/fonts/OFL.txt`).

Para renderizar de novo (com a skill instalada em `~/.claude/skills/motionmaxxing`):

```bash
node ~/.claude/skills/motionmaxxing/scripts/render.mjs video/index.html video/final.mp4 --shutter 180 --subframes 8 --grain 0.03 --crf 16
```
