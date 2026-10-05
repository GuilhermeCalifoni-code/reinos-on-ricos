-- Reinos Oníricos
-- Biblioteca pessoal de personagens para contas autenticadas.

drop policy if exists "owners read own characters" on public.personagens;
drop policy if exists "owners update unlinked own characters" on public.personagens;

create policy "owners read own characters"
on public.personagens
for select
to authenticated
using (owner_user_id = auth.uid());

create policy "owners update unlinked own characters"
on public.personagens
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and campaign_id is null
)
with check (
  owner_user_id = auth.uid()
  and campaign_id is null
);
