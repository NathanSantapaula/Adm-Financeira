# AVEN, filme de lançamento (20 s): ideia e storyboard

Rascunho para aprovação. Nada foi produzido ainda.

## 1. PAGE

| | |
|---|---|
| **Problema** | A pessoa até ganha bem, mas não sabe para onde foi o dinheiro do mês nem onde investir o que sobra. Planilha solta, extrato que ninguém lê. |
| **Público** | Clientes e possíveis clientes do Nathan (XP), 25 a 50 anos, assistindo no celular ou no WhatsApp, muitas vezes sem som. |
| **Objetivo** | Fazer a pessoa entender em 20 s o que o AVEN faz e querer fazer o diagnóstico. |
| **Emoção** | De "bagunça, não sei o que aconteceu com meu salário" para "alívio, está tudo no lugar". |

**A verdade única:** no AVEN, cada real do extrato tem um destino: vira gasto conferido, cabe no orçamento, e o que sobra vira o próximo aporte.

## 2. Inventário da marca (capturado do site)

| Item | O que tem no AVEN |
|---|---|
| Forma do logo | "AVEN" com uma **seta azul** (#0A84FF) dentro do A, apontando para cima. É o único ponto de cor da marca. |
| Controle principal | O botão **Confirmar** da importação do extrato ("Nada é gravado sem você conferir: experimente confirmar o do meio"). O controle deslizante **Aporte do mês**. |
| Material | Linhas de extrato em maiúsculas (FARMACIA CENTRAL 88, POSTO AVENIDA 2210), valores em R$, barras de orçamento em gradiente azul-violeta. |
| Verbo | Conferir, dar baixa, aportar. |
| Momento de sucesso | O orçamento fechando dentro do limite e a sobra indo para o aporte certo. |
| Voz | Direta, calma, sem promessa: "Seu patrimônio, sob controle.", "Sem planilhas soltas, sem adivinhar.", "Ninguém vende nada." |
| Cores | Fundo claro #f5f6f9 com luz azulada; tinta #111318; azul #0068da = ação; seção do simulador em azul-marinho profundo. |
| Tipo | SF Pro Display (do sistema, sem arquivo). No filme: **Inter**, a parente mais próxima, já inclusa na skill. |
| Nunca fariam | Prometer rentabilidade, foguete, gráfico explodindo, cifrão dourado, clima de "fique rico". |

## 3. As ideias

1. **Primeira ideia (descartada):** moedas caindo e um gráfico subindo com "Seu dinheiro rendendo mais". É a fantasia da categoria e, pior, vira promessa de rentabilidade.
2. **Documentário de um mês, numa linha de extrato** *(escolhida)*. Seguimos **um real de verdade**: a linha POSTO AVENIDA 2210 sai do extrato, é confirmada, cai na barra de Transporte do orçamento, e a parte da barra que **sobrou** se solta e vira o trilho do "Aporte do mês". O aporte é distribuído e sobe até virar a seta azul do A.
3. **Ensaio tipográfico:** uma página densa de extrato bancário em letra miúda; cada linha é riscada e categorizada até sobrar uma única frase: "Seu patrimônio, sob controle." Bonito, mas mostra pouco do produto.
4. **Plano único que muda:** câmera parada sobre a Visão geral enquanto um mês inteiro acontece (lançamentos entrando, barras enchendo). Calmo, mas sem uma virada clara.

**Por que a 2:** é a única em que a marca e o produto fazem a ação. A seta do logo é o próprio aporte chegando ao lugar, o botão Confirmar é o do site e os valores são os da página. Tampando o logo, ainda é o AVEN: nenhum concorrente tem esse caminho extrato → orçamento → sobra → aporte com essas telas.

## 4. Sistema do filme

| Decisão | Escolha |
|---|---|
| Formato | 1920×1080, 30 fps, 20,0 s (600 quadros) |
| Relógio e movimento | Contínuo, com desfoque de obturador real (`--shutter 180`): é UI que precisa ficar legível. |
| Tipo | Inter 400–600, frases com inicial maiúscula, tracking −3%. Números em tabular. |
| Mundo, ato 1 (0–12 s) | Fundo claro do site (#f5f6f9) com as manchas de luz azul e lilás do topo da página, profundidade de campo (linhas de trás desfocadas), granulação leve. |
| Mundo, ato 2 (12–20 s) | O azul-marinho do simulador do site (#0b1a3d → #1c3377) com uma luz azul vinda de baixo. A troca acontece por um objeto que cresce, não por um fade. |
| Cor de destaque | Azul #0A84FF = **"isto é seu e está no lugar"**: categoria confirmada, sobra, aporte, seta. Nada mais é azul. |
| Objeto carregado | O valor **R$ 210,00** (atos 1–2) e depois a **barra azul** da sobra (atos 3–5). |
| Cursor | Ponteiro do macOS, entra 3× maior e desacelera; para antes de clicar. |
| Momento-herói (print) | ~12,0 s: a sobra se solta da barra de orçamento, iluminada, enquanto o fundo vira azul-marinho atrás dela e ela vira o trilho do aporte. |
| Som | **Sem chave da ElevenLabs aqui: sem narração nem música.** Proposta: desenho de som mínimo gerado no próprio computador (toque de papel no extrato, clique no Confirmar, um grave curto quando a seta encaixa, silêncio antes). Ou filme mudo, se preferir. |

## 5. Storyboard

| # | Papel | Peso | Compra: o espectador… | Imagem (sem texto) | Texto na tela | O que se move | Passagem para o próximo | Tempo |
|---|---|---|---|---|---|---|---|---|
| 1 | gancho | 2 | …reconhece a própria bagunça: um extrato que ninguém lê. | Linhas de extrato em maiúsculas passando rápido de baixo para cima em diagonal, sobre o fundo claro com luz azul; as linhas da frente nítidas, as de trás desfocadas. A rolagem freia e uma linha para no foco: **POSTO AVENIDA 2210 −R$ 210,00**. | "Para onde vai cada real?" (centralizada, palavra a palavra, some quando a rolagem para) | Rolagem desacelerando, foco puxando para a linha do meio. | A linha em foco não sai: a câmera recua e ela já está dentro do cartão "Importação de outubro". | 0,0–3,5 s |
| 2 | prova | 2 | …vê que o AVEN já sugere a categoria e que nada entra sem ela conferir. | O cartão real da importação, cortado pela borda do quadro, em macro (texto ≥ 4% da altura). Etiqueta "Transporte, sugerido". O cursor entra, para, aperta **Confirmar** (o botão afunda 2 quadros). | Só a UI do site: FARMACIA CENTRAL 88, POSTO AVENIDA 2210, Supermercado Boa Vista, Confirmar. | Cursor, clique, a etiqueta fica azul com um ✓, o valor R$ 210,00 se solta da linha e cai. | O valor cai para fora do quadro em baixo; corte em movimento para o orçamento, onde ele chega de cima. | 3,5–8,0 s |
| 3 | prova | **3** | …entende que o gasto já deu baixa no orçamento do mês e quanto sobrou. | Cartão real "Outubro R$ 4.680 de R$ 6.000", em macro. O R$ 210,00 entra na linha **Transporte** e a barra cresce até R$ 620,00. A câmera desliza para a barra total: a parte vazia acende em azul. | UI do site + "Sobra para investir." (frase curta, aparece quando a parte vazia acende) | Barra de Transporte crescendo, contador do total subindo por quadro, câmera deslizando. | A parte acesa da barra **se solta** e cresce para a direita, enchendo o quadro; atrás dela o fundo vira azul-marinho. (momento-herói) | 8,0–12,5 s |
| 4 | prova | 2 | …vê o AVEN dizer exatamente onde investir, sem vender nada. | No mundo azul-marinho, a barra solta vira o trilho do **Aporte do mês**; o polegar desliza, o valor sobe até **R$ 5.000,00**. Corte em movimento para o cartão "Onde investir R$ 5.000,00": Fundo de índice de ações R$ 3.000,00, Fundo imobiliário R$ 2.000,00. | UI do site + "Ninguém vende nada." | Polegar do controle, contador, as duas linhas da carteira chegando de baixo. | Os dois valores azuis sobem juntos e se fundem num triângulo azul que continua subindo. | 12,5–16,5 s |
| 5 | encerramento | 2 | …guarda o nome e a frase da marca. | O triângulo azul sobe e encaixa no A do **AVEN** como a seta (o aporte chegou ao lugar). Wordmark grande, depois assenta menor. Fundo volta ao claro do site pela própria letra A crescendo. | "Seu patrimônio, sob controle." (frase oficial do site) e "AVEN" | Seta encaixando com uma leve desaceleração, a frase entra palavra a palavra. Uma luz azul suave respira atrás. | Fim: quadro parado e resolvido por 1,0 s. | 16,5–20,0 s |

Encerramento = 3,5 s (17,5% do filme, limite de 25%). Só 1 de 5 batidas tem peso 3.

## 6. O que é real e o que é ilustrativo

- **Real (do site):** logo e seta, cores, frase "Seu patrimônio, sob controle.", "Ninguém vende nada.", cartões de Importação, Orçamento e Onde investir, com os mesmos nomes e valores que estão publicados na página inicial.
- **Ilustrativo:** as linhas extras do extrato que passam rápido no gancho (nomes de estabelecimento genéricos, ilegíveis na velocidade), a pergunta "Para onde vai cada real?" (adaptada do texto do site: "veja para onde vai cada real") e "Sobra para investir." (do texto "quanto sobra para investir").
- Os valores da carteira já são ilustrativos no próprio site ("Valores ilustrativos, não é recomendação"). Sem aviso legal no vídeo; fica registrado na nota de entrega.

## 7. Entrega

- `aven-lancamento-20s.mp4` em 1080p.
- **Pasta Downloads:** daqui eu não alcanço o seu aparelho. Envio o arquivo nesta conversa e, ao tocar em baixar, ele vai para os Downloads.
