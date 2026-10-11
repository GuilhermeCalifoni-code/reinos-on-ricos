-- Phase 37: propagate character linking, joining, leaving and role changes.
-- RLS on campaign_members already restricts SELECT to current campaign members.
-- This publication must be applied in staging before testing; do not run
-- directly in production before membership-event security tests.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaign_members'
  ) then
    alter publication supabase_realtime add table public.campaign_members;
  end if;
end
$$;
