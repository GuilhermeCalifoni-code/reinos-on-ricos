-- SQL consolidada da Fase 6. Execute após as migrations 001 a 005.
-- É idêntica à migration 006_session_events.sql e não exclui dados.
create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade,
  session_id uuid, created_by uuid not null references auth.users(id) on delete restrict,
  character_id text references public.personagens(id) on delete set null,
  type text not null check (type in ('chat','character_speech','ooc','whisper','roll','system','rupture','damage','condition','counter_update','scene_change','clue_reveal','map_event')),
  visibility text not null default 'todos' check (visibility in ('todos','mestre','usuario_especifico')),
  recipient_user_id uuid references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 4000), metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'), created_at timestamptz not null default now(),
  constraint session_events_recipient_matches_visibility check ((visibility = 'usuario_especifico' and recipient_user_id is not null) or (visibility <> 'usuario_especifico' and recipient_user_id is null))
);
create index if not exists session_events_campaign_created_idx on public.session_events(campaign_id, created_at);
create index if not exists session_events_recipient_idx on public.session_events(recipient_user_id, campaign_id) where recipient_user_id is not null;
create or replace function public.is_active_campaign_member(p_campaign_id uuid, p_user_id uuid) returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from public.campaign_members where campaign_id = p_campaign_id and user_id = p_user_id and status = 'ativo'); $$;
create or replace function public.is_campaign_player(p_campaign_id uuid) returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from public.campaign_members where campaign_id = p_campaign_id and user_id = auth.uid() and role = 'jogador' and status = 'ativo'); $$;
create or replace function public.can_read_session_event(p_campaign_id uuid, p_visibility text, p_recipient_user_id uuid) returns boolean language sql security definer stable set search_path = public as $$ select public.is_campaign_master(p_campaign_id) or (p_visibility = 'todos' and public.is_campaign_member(p_campaign_id)) or (p_visibility = 'usuario_especifico' and p_recipient_user_id = auth.uid() and public.is_campaign_member(p_campaign_id)); $$;
alter table public.session_events enable row level security;
drop policy if exists "campaign members read allowed session events" on public.session_events;
drop policy if exists "campaign members create allowed session events" on public.session_events;
create policy "campaign members read allowed session events" on public.session_events for select using (public.can_read_session_event(campaign_id, visibility, recipient_user_id));
create policy "campaign members create allowed session events" on public.session_events for insert with check (created_by = auth.uid() and public.is_campaign_member(campaign_id) and (visibility <> 'usuario_especifico' or public.is_active_campaign_member(campaign_id, recipient_user_id)) and (public.is_campaign_master(campaign_id) or (public.is_campaign_player(campaign_id) and type in ('chat','character_speech','ooc','roll') and visibility = 'todos')));
alter table public.session_events replica identity full;
do $$ begin if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'session_events') then alter publication supabase_realtime add table public.session_events; end if; end $$;
