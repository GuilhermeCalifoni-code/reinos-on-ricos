# Ordem das migrações (T5)

- As migrações rodam em **ordem alfabética do nome do arquivo** (`001_…` até `048_…`).
- Os dois arquivos `020_*` rodam nesta ordem: `020_community_memberships_v1.sql` e depois `020_profile_ui_preferences.sql`. Não renomeamos porque a produção já registrou esses nomes.
- Não existe `038`. O número foi pulado; nada está faltando.
- `npm run test:migracao` monta um banco do zero e aplica todas (também roda no CI). Se uma migração nova quebrar a cadeia, o CI fica vermelho.

## Correções feitas na T5 (antes só 16 de 48 rodavam do zero)

| Arquivo | Problema | Correção |
|---|---|---|
| 002 | faltava `end if` em `join_campaign_by_code` | adicionado |
| 009 | `$` em vez de `$$` em `is_campaign_master_user` | corrigido |
| 011 | `profiles.email` existia só em produção | `add column if not exists email` |
| 011 | `rls_auto_enable()`, `mesas`, `cenas_tensao`, `rolagens` existem só em produção | comandos só rodam se existirem |

Nenhuma correção muda a produção: lá esses objetos já existem e as migrações já foram aplicadas.

## Quem mexe em qual banco
- Teste (`reinos-oniricos-teste`): Claude, pelo conector Supabase.
- Produção (`RO rpg`): ChatGPT, com aprovação A3 do Guilherme.
