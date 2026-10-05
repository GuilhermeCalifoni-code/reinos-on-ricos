-- Reinos Oníricos
-- Marca campanhas importadas do armazenamento local para tornar a migração idempotente.

alter table public.campaigns
add column if not exists legacy_local_id text;

create unique index if not exists campaigns_owner_legacy_local_id_key
on public.campaigns(owner_id, legacy_local_id)
where legacy_local_id is not null;
