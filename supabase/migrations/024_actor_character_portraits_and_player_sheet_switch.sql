-- Reinos Oníricos — retratos de fichas/atores + troca segura da ficha do jogador.

alter table public.personagens
  add column if not exists imagem_url text;

alter table public.campaign_npcs
  add column if not exists imagem_url text;

alter table public.campaign_adversaries
  add column if not exists imagem_url text;

create or replace function public.link_own_character_to_membership(
  p_campaign_id uuid,
  p_character_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_character_id text;
begin
  if not public.is_campaign_member(p_campaign_id) then
    raise exception 'campaign membership required';
  end if;

  select character_id
    into previous_character_id
  from public.campaign_members
  where campaign_id = p_campaign_id
    and user_id = auth.uid();

  if p_character_id is null or btrim(p_character_id) = '' then
    if previous_character_id is not null then
      update public.personagens
      set campaign_id = null,
          atualizado_em = now()
      where id = previous_character_id
        and owner_user_id = auth.uid()
        and campaign_id = p_campaign_id;
    end if;

    update public.campaign_members
    set character_id = null
    where campaign_id = p_campaign_id
      and user_id = auth.uid();

    return;
  end if;

  update public.personagens
  set campaign_id = p_campaign_id,
      atualizado_em = now()
  where id = p_character_id
    and owner_user_id = auth.uid()
    and (campaign_id is null or campaign_id = p_campaign_id);

  if not found then
    raise exception 'character is not owned by current user or is linked to another campaign';
  end if;

  if previous_character_id is not null and previous_character_id <> p_character_id then
    update public.personagens
    set campaign_id = null,
        atualizado_em = now()
    where id = previous_character_id
      and owner_user_id = auth.uid()
      and campaign_id = p_campaign_id;
  end if;

  update public.campaign_members
  set character_id = p_character_id
  where campaign_id = p_campaign_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.link_own_character_to_membership(uuid,text) from public, anon;
grant execute on function public.link_own_character_to_membership(uuid,text) to authenticated;

drop policy if exists "character owners upload portraits" on storage.objects;
create policy "character owners upload portraits"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'reinos-oniricos'
  and name ~ '^characters/[0-9a-fA-F-]{36}/'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "character owners update portraits" on storage.objects;
create policy "character owners update portraits"
on storage.objects for update to authenticated
using (
  bucket_id = 'reinos-oniricos'
  and name ~ '^characters/[0-9a-fA-F-]{36}/'
  and split_part(name, '/', 2) = auth.uid()::text
)
with check (
  bucket_id = 'reinos-oniricos'
  and name ~ '^characters/[0-9a-fA-F-]{36}/'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "character owners delete portraits" on storage.objects;
create policy "character owners delete portraits"
on storage.objects for delete to authenticated
using (
  bucket_id = 'reinos-oniricos'
  and name ~ '^characters/[0-9a-fA-F-]{36}/'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "character participants read portraits" on storage.objects;
create policy "character participants read portraits"
on storage.objects for select to authenticated
using (
  bucket_id = 'reinos-oniricos'
  and name ~ '^characters/[0-9a-fA-F-]{36}/'
  and exists (
    select 1
    from public.personagens p
    where p.imagem_url = ('storage:' || storage.objects.name)
      and (
        p.owner_user_id = auth.uid()
        or (
          p.campaign_id is not null
          and public.is_campaign_member(p.campaign_id)
        )
      )
  )
);
