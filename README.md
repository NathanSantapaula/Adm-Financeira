# Financial planning, por Nathan Santapaula

Sistema web de planejamento financeiro com assessoria: página inicial persuasiva, cadastro com login, diagnóstico (patrimônio e perfil de investidor), painel de boas-vindas, rendas, conta corrente com orçamento, investimentos, proventos, carteira com rebalanceamento por aporte, backup completo e área do consultor.

É um site **estático** (HTML, CSS e JavaScript puros, sem build). Hospede no **GitHub Pages** e use o **Supabase** como banco de dados e login.

```
index.html
assets/css/app.css          design system (tema claro e escuro automático)
assets/js/config.js         <- o ÚNICO arquivo que você precisa editar
assets/js/engine.js         cálculos, parcelamento, rebalanceamento, importação e backup
assets/js/store.js          camada de dados (Supabase ou navegador)
assets/js/*.js              telas e interface
supabase/schema.sql         tabelas e regras de segurança do banco
tests/engine.test.js        testes do motor de cálculo
```

## 1. Testar na sua máquina (modo demonstração)

Abra `index.html` no navegador, ou rode `npx serve .`. Sem Supabase configurado, tudo funciona em **modo demonstração**: os dados ficam só no navegador e todos os recursos ficam liberados. Serve para conhecer o produto, não para clientes.

## 2. Configurar o banco e o login (Supabase)

1. Crie um projeto gratuito em https://supabase.com.
2. No **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute.
3. Em **Authentication > Providers**, deixe **Email** ativo. Recomendado: manter "Confirm email" ligado.
4. Em **Authentication > URL Configuration**, informe a URL do seu site no GitHub Pages em **Site URL** e em **Redirect URLs** (exemplo: `https://seu-usuario.github.io/financial-planning/`). É para onde voltam os links de confirmação de e-mail e de recuperação de senha.
5. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public** para `assets/js/config.js`:
   ```js
   supabase: { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...' },
   ```
   A chave anon é pública por natureza: quem protege os dados são as regras (RLS) do `schema.sql`. **Nunca** coloque a chave `service_role` no site.
6. Crie a sua conta pelo próprio site e, no SQL Editor, torne-se consultor:
   ```sql
   insert into public.consultores (user_id) select id from auth.users where email = 'seu-email@exemplo.com';
   ```
   Depois disso aparece a aba **Clientes** no seu menu.

## 3. Preencher seus dados de contato

Em `assets/js/config.js`, preencha `whatsapp`, `email`, `agendaUrl` (link de agendamento), `xpUrl` e `paymentUrl` (link de pagamento do plano). Campos vazios não aparecem no site. Preencha também `bio`, `credenciais` e `depoimentos` se quiser prova de autoridade na página inicial (só aparecem se preenchidos; use apenas informações verdadeiras e autorizadas).

## 4. Publicar no GitHub Pages

1. Crie um repositório e envie estes arquivos (`git init`, `git add .`, `git commit`, `git push`).
2. No repositório: **Settings > Pages > Build and deployment > Deploy from a branch > main / (root)**.
3. Em alguns minutos o site estará em `https://seu-usuario.github.io/nome-do-repositorio/`. Domínio próprio: Settings > Pages > Custom domain.

## 5. Como funciona a cobrança e a ativação da assessoria

O site **não processa pagamentos**. O fluxo é:

1. O cliente se cadastra, faz o diagnóstico e pede a assessoria. O pedido aparece para você na aba **Clientes** ("Solicitou").
2. Ele paga pelo seu link (`paymentUrl`) e envia o comprovante por WhatsApp ou e-mail.
3. Você confirma o pagamento e, na aba **Clientes**, troca o plano dele para **Completo**. Isso libera a aba Carteira e a importação de planilhas na conta dele, e só você consegue fazer essa troca (regra do banco).

Para automatizar (pagamento aprova, plano libera sozinho), crie uma Edge Function do Supabase que receba o webhook do seu meio de pagamento e grave em `assinaturas` com a chave `service_role`. Isso exige servidor e fica fora deste pacote.

## 6. Privacidade e LGPD

- Cada cliente só lê e grava os próprios dados (RLS).
- Você, como consultor, enxerga **apenas** nome, contato, plano e o resultado do diagnóstico (patrimônio informado, perfil e objetivo). **Não** enxerga lançamentos, rendas, gastos nem ativos dos clientes.
- O texto de "Termos e privacidade" (`assets/js/ui.js`, função `openTerms`) é genérico: **revise com seu jurídico/compliance** antes de divulgar, junto com as frases de aviso da página inicial e a comunicação de assessoria de investimentos.
- O questionário de perfil é simplificado e não substitui a análise de adequação (suitability) da assessoria.

## 7. Backup e importação

- **Backup completo** (Painel administrativo): baixa um único arquivo `.json` com perfil, todos os anos, rendas, gastos, ativos e carteira. **Restaurar backup** recoloca tudo (também lê o arquivo de um único ano das versões anteriores).
- **Importar planilha (.xlsx)**: o Painel traz o modelo para baixar. É um recurso do plano completo e serve, por exemplo, para você enviar a carteira montada ao cliente.

## 8. Testes

```bash
npm install
npm test
```

## 9. Bibliotecas externas (carregadas por CDN)

`@supabase/supabase-js` 2.45.4 (jsDelivr, só quando o Supabase está configurado), `xlsx` 0.18.5 (cdnjs, só ao usar a importação) e a fonte Inter (Google Fonts, opcional). Para não depender de CDN, baixe os arquivos e aponte os endereços em `assets/js/store.js`, `assets/js/admin.js` e `index.html`.

## 10. Limitações conhecidas

- Sem autenticação em dois fatores (o Supabase oferece MFA; precisa ser ligado e ter tela própria).
- Sem webhook de pagamento (item 5) e sem cotações de mercado: o patrimônio é calculado a custo (patrimônio informado mais aportes) e, na Carteira, o cliente pode digitar o valor atual de cada ativo.
- Dois dispositivos editando o mesmo ano ao mesmo tempo: vale o último salvamento.
- A integração com o Supabase foi testada com um simulador do serviço, não com um projeto real. Faça o roteiro do item 2 e um cadastro de teste antes de divulgar.
