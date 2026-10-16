# AVEN, lançamento 20 s: nota de entrega

**Arquivo:** `aven-lancamento-20s.mp4`, 1920×1080, 30 fps, 20,0 s, H.264, sem som (o som entra numa próxima etapa).
**Fonte editável:** `index.html` (seek-safe, runtime motionmaxxing).

## A ideia
Seguir um real de verdade por um mês: a linha POSTO AVENIDA 2210 (−R$ 210,00) é confirmada, dá baixa no orçamento de outubro, a parte que sobra da barra se solta e vira o trilho do "Aporte do mês", o aporte é distribuído e sobe até virar a seta azul dentro do A do AVEN. A seta do logo é o próprio aporte chegando ao lugar.

## Batidas e o que cada uma compra
| Tempo | Batida | Compra |
|---|---|---|
| 0–3,3 s | "Para onde vai cada real?" sobre um extrato que rola e freia | O espectador reconhece a própria bagunça. |
| 3,3–6,9 s | Cartão de importação: cursor confirma "Transporte" | Vê que nada entra sem ele conferir. |
| 6,9–11,3 s | O valor cai na barra de Transporte (R$ 410 → R$ 620), total R$ 4.470 → R$ 4.680, a sobra acende: "Sobra para investir." | Entende que o gasto já está no orçamento e o que sobrou. |
| 11,3–12,4 s | **Herói:** a sobra se solta e o mundo vira azul-marinho | A sobra vira dinheiro para investir. |
| 12,4–16,7 s | Aporte do mês até R$ 5.000,00; "Onde investir": R$ 3.000 + R$ 2.000; "Ninguém vende nada." | O AVEN diz onde investir, sem vender nada. |
| 16,7–20 s | A seta encaixa no A; "Seu patrimônio, sob controle." | Guarda o nome e a frase da marca. |

## Real e ilustrativo
- **Real (do site publicado):** logo e seta (#0A84FF), cores, fundo claro com luz azul e lilás, azul-marinho do simulador, a frase "Seu patrimônio, sob controle.", "Ninguém vende nada.", e os cartões de Importação, Orçamento e Onde investir com os mesmos nomes e valores da página inicial.
- **Ilustrativo:** as linhas extras do extrato que passam desfocadas no gancho; os números de partida das animações (Transporte R$ 410,00, total R$ 4.470, aporte começando em R$ 2.000,00), que terminam nos valores reais do site; "Para onde vai cada real?" e "Sobra para investir." (adaptadas de frases do site). Os valores da carteira já são ilustrativos no próprio site.
- **Tipo:** o site usa SF Pro (fonte do sistema Apple, sem arquivo para baixar); o filme usa Inter, a mais próxima.
- Removido do cartão o cabeçalho "Importação de outubro", porque, ampliado pela câmera, ficava como rótulo no canto da tela (falha C1 do lint).

## Verificações (números dos scripts)
- **look.py** (`--expect 20`): G0 PASS (20,00 s, 600 quadros); G2 PASS (nenhum trecho com mais de 3 quadros vazios); G3 PASS (imagem parada no fim 1,27 s, dentro de 0,6–1,4; encerramento 3,33 s = 17% do filme). Primeira versão reprovou G3 (1,57 s): a frase final passou a entrar 9 quadros depois.
- **lint.mjs:** GATE G5 PASS. Aviso V4 (texto cinza) em "Importado do extrato de outubro": é o cinza real do site (#4a4f59), mantido.
- **Motion.selfTest:** ok, 24 saltos aleatórios, 164 elementos, 0 divergências.
- **Movimento:** variação média 2,2/255, abaixo da faixa de filmes humanos (4,4–9,8). É um filme calmo, coerente com a marca, mas é o ponto mais fraco medido.
- **G1 (a olho):** os valores e nomes principais ficam entre 39 e 80 px de altura. As linhas do orçamento no plano aberto (≈ 29 px) ficam abaixo dos 43 px recomendados; o que importa ali é o total e a barra.
- **G4 (a olho):** um herói por quadro em todos os quadros da folha de contato.

## Descrição de cada quadro da folha (look-final/sheet.jpg)
1. "Para onde vai cada" subindo palavra a palavra sobre extrato quase invisível. 2. Pergunta completa, extrato desfocado atrás. 3. A linha do POSTO em foco, o cartão branco se formando em volta. 4. Cartão completo, cursor grande entrando pela direita. 5. Chip "✓ Transporte" confirmado, cursor parado. 6–7. Orçamento em close, Transporte subindo de R$ 410 para R$ 596. 8. Câmera abrindo no total, R$ 4.646 contando. 9. "Sobra para investir." com a sobra acesa em azul. 10. A sobra num casulo azul-marinho que cresce (herói). 11. Aporte do mês contando, polegar no trilho. 12. Cartão Onde investir entrando. 13. Onde investir completo e "Ninguém vende nada." 14. AVEN com a seta subindo para o A. 15. AVEN com "Seu" entrando. 16. Final: AVEN e "Seu patrimônio, sob controle."

## O que eu ainda melhoraria
- Som: um clique no Confirmar, um grave curto quando a seta encaixa e silêncio antes da troca para o azul-marinho.
- Mais vida nos trechos parados (4,3–5,4 s, cursor a caminho do botão) com uma leve aproximação da câmera.
- Versão vertical 9:16 (os enquadramentos precisam ser refeitos, não só cortados).
