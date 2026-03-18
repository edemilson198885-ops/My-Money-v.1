# My Money + Supabase

## Já configurado neste pacote
- Cliente Supabase apontando para o projeto informado
- Login por magic link
- Setup inicial da residência
- Sincronização de households, profiles, members, templates e movements

## Antes de publicar
1. Suba os arquivos para o repositório do GitHub Pages.
2. No Supabase, mantenha estas URLs:
   - Site URL: https://edemilson198885-ops.github.io
   - Redirect URL: https://edemilson198885-ops.github.io/My-Money-v.1/
3. Rode também o arquivo `supabase_patch_allow_extra.sql` no SQL Editor.

## Primeiro teste
1. Abra o app publicado.
2. Digite seu e-mail e peça o magic link.
3. Clique no link do e-mail.
4. Volte ao app e crie a residência.
5. Confira as tabelas `households`, `profiles` e `members`.
