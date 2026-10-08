-- Alterações de PV em NPCs e Adversários propagadas às sessões online.
-- RLS existente continua restringindo leitura por visibilidade e escrita ao Mestre.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='campaign_npcs'
  ) then
    alter publication supabase_realtime add table public.campaign_npcs;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='campaign_adversaries'
  ) then
    alter publication supabase_realtime add table public.campaign_adversaries;
  end if;
end $$;
