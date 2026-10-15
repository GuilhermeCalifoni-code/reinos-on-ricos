# Limite de Desvelados para administradores — playtest 2026

## Confirmacao da causa (15/10)
O Supabase usa `community_limit_for_user(user_id, 'characters')` no trigger `personagens_enforce_plan_limit`, e a configuracao do nivel gratuito e **2**. O cargo `admin` em `platform_access` nao alterava esse limite: Diogo tinha admin com 2 vagas; a conta raiz `super_admin` tambem tinha 2.

Na consulta de diagnostico, cada uma das duas contas possuia **1 ficha efetivamente persistida** no banco. Nao afirmar que ja existem 2 fichas no servidor. Validar mensagens de erro e possiveis fichas locais.

## Correcao
A migration 039 da **50 fichas** para membros com `platform_access.role IN ('admin','super_admin')`, sem alterar os niveis, beneficios pagos, papeis nas campanhas ou limites dos usuarios gratuitos. `community_limit_int('characters')`, usado pelo frontend, e o trigger de insercao passam a retornar a mesma cota.

## Checklist de aplicacao — bloqueio por backup
- [ ] Gerar backup criptografado PostgreSQL + Storage (conforme `docs/backup-and-restore-oct31.md`) e comprovar restauracao.
- [ ] Revisar migration e funcao atual de quota; garantir alteracoes posteriores nao sobrepuseram `community_limit_for_user`.
- [ ] Aplicar migration 039 pelo processo de release, nao via SQL improvisado.
- [ ] Validar SQL para Diogo e conta raiz: `community_limit_for_user(user_id, 'characters') = 50`.
- [ ] Testar criação da 3a ficha numa conta admin, com sessao autentica e sem apagar fichas.
- [ ] Validar usuario gratuito = 2, e protecao de insercao ao ultrapassar 2.
- [ ] Validar que `projects` e todas as demais cotas continuam inalteradas.
- [ ] Validar que cargo admin nao permite nomear super_admin nem ler outras fichas sem permissao.

## Reversao
Reaplicar a definicao *preexistente* de `public.community_limit_for_user` de `supabase/migrations/022_community_lean_plans_and_quotas.sql`, observando que migrations posteriores podem ter atualizado essa funcao. O rollback da funcao **nao apaga fichas** ja criadas. Usuarios acima do novo limite nao conseguem criar fichas adicionais ate voltarem a ficar abaixo da cota.
