-- Mesa Ao Vivo: clocks/counters are strictly GM-only, independent of the
-- legacy 'visibility' flag. Hiding the button alone would not protect data.
-- Existing shared counters/events are secured BEFORE new access policies.
update public.session_counters set visibilidade='mestre_privado'
where visibilidade<>'mestre_privado';

alter table public.session_counters
  add constraint session_counters_gm_only_visibility
  check (visibilidade='mestre_privado');

drop policy if exists "members read visible counters" on public.session_counters;
drop policy if exists "masters read counters only" on public.session_counters;
create policy "masters read counters only" on public.session_counters
  for select to authenticated
  using (public.is_campaign_master(campaign_id));

-- Public session feed must never disclose counter names, values or metadata.
-- Cover both new events and events already written by older clients.
update public.session_events
set visibility='mestre',recipient_user_id=null
where type='counter_update' and
  (visibility<>'mestre' or recipient_user_id is not null);

drop policy if exists "counter events private read guard" on public.session_events;
create policy "counter events private read guard" on public.session_events
  as restrictive for select to authenticated
  using (type<>'counter_update' or public.is_campaign_master(campaign_id));

drop policy if exists "counter events private insert guard" on public.session_events;
create policy "counter events private insert guard" on public.session_events
  as restrictive for insert to authenticated
  with check (type<>'counter_update' or
    (visibility='mestre' and recipient_user_id is null));

-- Previous write policies ('masters create/manage/delete counters') stay intact.
-- SECURITY NOTE: Supabase Realtime postgres_changes honors RLS on SELECT.
