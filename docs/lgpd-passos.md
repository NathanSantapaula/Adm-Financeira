# LGPD: o que falta para publicar

O código está no branch `claude/modo-basico-8636a4` (commit `a8452d1`). Ele traz:

- a página de privacidade e o aceite com versão;
- os botões "Excluir minha conta" e "Baixar meus dados";
- a migration `supabase/migrations/003_lgpd_seguranca.sql`.

## Já conferido

- **Sem a migration, o site não quebra:** se a função do banco ainda não existir, "Excluir minha conta" mostra "Não foi possível excluir a conta agora…" e mais nada muda.
- **Supabase protegido no carregamento:** o hash de integridade (SRI) do `supabase-js@2.45.4` confere com o arquivo publicado no jsDelivr. Se não conferisse, o login inteiro pararia.
- **Exclusão em cascata:** todas as tabelas ligadas ao login (`perfis`, `planos`, assinatura, recomendação, consultor) têm `on delete cascade`, então apagar o usuário apaga o resto.
- **A migration pode rodar de novo:** usa `create or replace`, `drop ... if exists` e restrições `not valid`, que não travam dados antigos.

## Passo a passo no Supabase

1. Crie um projeto de teste no Supabase, ou use um que já exista. Nunca teste em produção.
2. Em **SQL Editor**, cole e rode o `supabase/schema.sql` do branch. Isso monta o banco de teste do zero.
3. Aponte uma cópia do site para esse projeto: só a URL e a chave `anon` no `config.js` da cópia. Não altere o `config.js` do repositório.
4. Teste com duas contas, A e B:
   - [ ] A cria conta, aceita a política e vê o painel.
   - [ ] A em "Baixar meus dados" recebe um arquivo com perfil e planejamentos.
   - [ ] A tenta mudar o próprio e-mail no perfil: ele continua igual ao do login.
   - [ ] A envia um PDF de extrato (com IA ligada): aceita PDF até 10 MB; outro tipo de arquivo é recusado.
   - [ ] A em "Excluir minha conta": sai do app, não consegue entrar de novo e, em **Table Editor**, `perfis` e `planos` não têm mais linhas de A.
   - [ ] B continua com os dados intactos.
5. Deu tudo certo? No projeto de **produção**, em SQL Editor, rode só o `003_lgpd_seguranca.sql`.
6. Só depois publique o site (merge do branch na `main` e push).

## Fora do código

- **Revisão jurídica** do texto em `assets/js/politica.js`: base legal, prazos, compartilhamento com XP e com a IA, e o canal do encarregado (DPO).
- Ao mudar o texto da política, troque `POLITICA_VERSAO` em `politica.js`, para os clientes aceitarem de novo.
