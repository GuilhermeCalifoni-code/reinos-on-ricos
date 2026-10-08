-- Hardening de segurança após auditarmos os privilégios herdados do Supabase.
-- Somente Mestre pode consultar e alterar PV de cópias de adversários.
revoke all on public.map_token_resources from public, anon, authenticated;
grant select,insert,update on public.map_token_resources to authenticated;

drop policy if exists "masters insert token resources" on public.map_token_resources;
drop policy if exists "masters update token resources" on public.map_token_resources;

create policy "masters insert token resources" on public.map_token_resources
for insert to authenticated with check (
  public.is_campaign_master(map_token_resources.campaign_id)
  and exists (
    select 1 from public.map_tokens t
    where t.id = map_token_resources.token_id
      and t.campaign_id = map_token_resources.campaign_id
      and t.tipo in ('npc','adversario')
  )
);
create policy "masters update token resources" on public.map_token_resources
for update to authenticated
using (public.is_campaign_master(map_token_resources.campaign_id))
with check (
  public.is_campaign_master(map_token_resources.campaign_id)
  and exists (
    select 1 from public.map_tokens t
    where t.id = map_token_resources.token_id
      and t.campaign_id = map_token_resources.campaign_id
      and t.tipo in ('npc','adversario')
  )
);
