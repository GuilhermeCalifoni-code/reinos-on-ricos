alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.personagens enable row level security;

drop policy if exists "Permitir tudo em perfis" on public.profiles;
drop policy if exists "Permitir tudo em personagens" on public.personagens;
drop policy if exists "campaign members can read campaigns" on public.campaigns;
drop policy if exists "masters can update campaigns" on public.campaigns;
drop policy if exists "users can read their campaign members" on public.campaign_members;
drop policy if exists "masters manage campaign members" on public.campaign_members;
drop policy if exists "members can read characters" on public.personagens;
drop policy if exists "owners and masters manage characters" on public.personagens;
create policy "users read own profile" on public.profiles for select using (user_id = auth.uid());
create policy "users update own profile" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users insert own profile" on public.profiles for insert with check (user_id = auth.uid());
create policy "campaign members can read campaigns" on public.campaigns for select using (public.is_campaign_member(id));
create policy "owners create campaigns" on public.campaigns for insert with check (owner_id = auth.uid());
create policy "masters update campaigns" on public.campaigns for update using (public.is_campaign_master(id)) with check (public.is_campaign_master(id));
create policy "users can read their campaign members" on public.campaign_members for select using (public.is_campaign_member(campaign_id));
create policy "masters manage campaign members" on public.campaign_members for update using (public.is_campaign_master(campaign_id)) with check (public.is_campaign_master(campaign_id));
create policy "members can read characters" on public.personagens for select using (campaign_id is not null and public.is_campaign_member(campaign_id));
create policy "owners and masters manage characters" on public.personagens for all using ((owner_user_id = auth.uid()) or (campaign_id is not null and public.is_campaign_master(campaign_id))) with check ((owner_user_id = auth.uid()) or (campaign_id is not null and public.is_campaign_master(campaign_id)));

revoke all on function public.create_campaign(text,text,text,text) from public;
revoke all on function public.join_campaign_by_code(text) from public;
revoke all on function public.regenerate_campaign_invite(uuid) from public;
revoke all on function public.link_own_character_to_membership(uuid,text) from public;
grant execute on function public.create_campaign(text,text,text,text), public.join_campaign_by_code(text), public.regenerate_campaign_invite(uuid), public.link_own_character_to_membership(uuid,text) to authenticated;
