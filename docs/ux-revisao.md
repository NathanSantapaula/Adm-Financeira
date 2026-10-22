# Revisão de UX/UI: AVEN completo

Data: 22/10/2026. Modo demonstração com dados de exemplo (2026, janeiro a outubro).
Conferido em 1024 px e 375 px, nos temas claro, oled e personalizado (claro com amarelo, oled com verde, claro com azul).

Severidade: **Alta** = algo some, fica ilegível ou passa informação errada. **Média** = confunde ou atrapalha. **Baixa** = acabamento.

## Verificação geral

- Rolagem lateral em 375 px: nenhuma, em todas as telas e no painel administrativo.
- Contraste (verificação automática do texto contra o fundo resolvido): sem falhas nos temas oled e personalizado. No claro, o texto secundário ficava em ~4,2:1 sobre o vidro. **Corrigido**: `--ink-3` do claro passou de `#6B717C` para `#5E646F`.

## Visão geral

| Sev. | Problema | Situação |
|---|---|---|
| Alta | Botão "Definir meus objetivos" do card do objetivo (voz Consultivo, com foto): texto escuro sobre o vidro escuro, quase invisível. A regra do vidro dos botões tinha mais especificidade que a do botão branco. | Corrigido (`app.css`) |
| Alta | Em 901–1300 px, a primeira linha do título passava por baixo dos botões do topo (olho, globo, período, assistente, perfil). | Corrigido: o título desce para a linha de baixo da saudação no computador |
| Média | No celular, o avatar caía sozinho numa segunda linha do topo. | Corrigido: botões do topo um pouco menores abaixo de 480 px, tudo numa linha |
| Média | "Para onde foi cada mês": no celular as abas quebravam no meio da palavra ("Tud o", "Entrada s"). | Corrigido |
| Média | Gráficos de barras no celular: "Set", "Out" e "Nov" sobrepostos quando o mês atual é ímpar. | Corrigido (`charts.js`: some o rótulo vizinho do mês atual) |
| Baixa | Card do objetivo em meia largura deixa um buraco à direita quando não há outro widget ao lado. | Não corrigido (layout do cliente) |

## Gastos

| Sev. | Problema | Situação |
|---|---|---|
| Média | "Maiores gastos" no ano repetia o mesmo aluguel seis vezes (um por mês) e escondia os outros gastos. | Corrigido em `E.analiseGastos` com teste: cada gasto previsto aparece uma vez |
| Baixa | "de R$ 108.000 orçados no ano Restam R$ 12.922." sem ponto entre as frases. | Corrigido |
| Baixa | "Importar extrato" é o botão principal e "Novo gasto" o secundário; o uso mais comum é o lançamento manual. | Não corrigido: decisão de produto |
| Baixa | "Contas do mês" tem rolagem própria dentro do cartão (rolagem dentro de rolagem). | Não corrigido |

## Rendas

| Sev. | Problema | Situação |
|---|---|---|
| Baixa | "Para estudar" repetia a taxa de poupança já mostrada no indicador ("Você guarda 29%..."). | Corrigido: a dica só aparece abaixo de 20%, quando traz o que fazer |
| Baixa | "Renda passiva 1,2% das entradas" e "Os proventos já pagam 1,7% dos seus gastos" ficam lado a lado com bases diferentes. | Não corrigido: anotar para revisão do texto |

## Investimentos

| Sev. | Problema | Situação |
|---|---|---|
| Média | "Quanto aportei" repetia os dividendos reinvestidos, que já estão em "De onde veio o aporte". | Corrigido |
| Média | "Disponível para aportar": o valor excedente aparecia duas vezes (no alerta e na lista). | Corrigido: o alerta explica, a lista mostra o valor |
| Baixa | Explicação da conta da sobra e a dica "Escolha um mês no calendário..." ocupavam linhas fixas. | Viraram "i" (continuam visíveis quando os gastos passam das entradas) |

## Proventos

| Sev. | Problema | Situação |
|---|---|---|
| Média | "Yield on cost": jargão em inglês sem explicação. | Corrigido: "Retorno em proventos", "ao ano, sobre o valor investido (a custo)" |
| Média | "Seu número da independência" com parágrafo de cinco linhas. | Corrigido: fica a frase "Você tem X (Y%). No ritmo atual, levaria N anos."; as premissas foram para o "i" |
| Baixa | Nome do ativo cortado com reticências no calendário de pagamentos em 375 px. | Aceitável (o nome inteiro aparece ao tocar) |

## Carteira

| Sev. | Problema | Situação |
|---|---|---|
| Média | Título "Onde investir R$ 0,00 em outubro" quando não há sobra. | Corrigido: sem valor zero no título |
| Baixa | "Alvos somam –" quando nenhum alvo foi definido. | Corrigido: "0%" |
| Baixa | Explicação do disponível repetia a de Investimentos. | Virou "i" |
| Baixa | Sem alvos, cada classe mostra "–" e "alvo" em cinco linhas seguidas; os botões de atalho resolvem, mas a tela parece vazia. | Não corrigido |

## Relatório

| Sev. | Problema | Situação |
|---|---|---|
| Média | Tabela "Mês a mês" mostrava R$ 0 em entradas, gastos, sobra e aplicado nos meses que ainda não chegaram. | Corrigido: traço nos meses sem lançamento |
| Média | Indicador "Aportes" (R$ 38.388) não batia com o "aportado" de Investimentos (R$ 40.000), que inclui dividendos reinvestidos. | Corrigido: rótulo "Aportes do bolso" |

## Painel administrativo

| Sev. | Problema | Situação |
|---|---|---|
| Baixa | Selo do plano ("Modo demonstração") esticava na largura inteira da seção. | Corrigido |
| — | Sem textos longos soltos e sem vazamento em 375 px nos três grupos. | OK |

## Globo

| Sev. | Problema | Situação |
|---|---|---|
| Baixa | "Fora do ar" em vermelho fora do horário comercial lembra erro, mas é estado normal. | Não alterado: decisão registrada do Nathan |
| Baixa | No celular, um orb de classe pode passar por cima de "Seu patrimônio" no centro; a lente afasta, mas não sempre. | Não corrigido (canvas) |

## Página inicial (fora do escopo, visto de passagem)

- Em 1024 px o item "O assessor" do menu quebra em duas linhas.
