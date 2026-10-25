-- DO NOT APPLY BEFORE EXTERNAL ENCRYPTED BACKUP AND TWO-ACCOUNT VALIDATION.
-- Campaign assets previously authorized any member to read every file by
-- prefix, including artwork for GM-only scenes, adversaries, and maps.
-- Scope all campaign-media downloads to their *own* record's visibility.
-- Historical signed URLs remain valid until expiry; rotate/expire as needed.
-- Idempotent and reversible via restoring the former policy definition.

drop policy if exists "campaign members read assets" on storage.objects;
drop policy if exists "campaign members read released assets" on storage.objects;

create policy "campaign members read released assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'reinos-oniricos'
  and name ~ '^campaigns/[0-9a-fA-F-]{36}/'
  and public.is_campaign_member((split_part(name, '/', 2))::uuid)
  and (
    -- Masters retain access to private and orphaned files inside their campaign.
    public.is_campaign_master((split_part(name, '/', 2))::uuid)
    -- Campaign covers are visible to authorized campaign members.
    or exists (
      select 1 from public.campaigns c
      where c.id = (split_part(storage.objects.name, '/', 2))::uuid
        and c.imagem_url = 'storage:' || storage.objects.name
    )
    or exists (
      select 1 from public.campaign_npcs a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and a.imagem_url = 'storage:' || storage.objects.name
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
    or exists (
      select 1 from public.campaign_adversaries a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and a.imagem_url = 'storage:' || storage.objects.name
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
    or exists (
      select 1 from public.campaign_scenes a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and a.imagem_url = 'storage:' || storage.objects.name
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
    or exists (
      select 1 from public.campaign_sessions a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and a.imagem_url = 'storage:' || storage.objects.name
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
    or exists (
      select 1 from public.narrative_maps a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and (a.imagem_url = 'storage:' || storage.objects.name
          or a.storage_path = storage.objects.name)
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
    or exists (
      select 1 from public.campaign_clues a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and a.imagem_url = 'storage:' || storage.objects.name
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
    or exists (
      select 1 from public.campaign_locations a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and a.imagem_url = 'storage:' || storage.objects.name
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
    or exists (
      select 1 from public.campaign_handouts a
      where a.campaign_id = (split_part(storage.objects.name, '/', 2))::uuid
        and (a.arquivo_url = 'storage:' || storage.objects.name
          or a.storage_path = storage.objects.name)
        and a.visibilidade in ('compartilhado', 'revelado_jogadores')
    )
  )
);
