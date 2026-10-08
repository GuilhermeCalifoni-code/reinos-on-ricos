-- Administração da plataforma separada dos papéis Mestre/Jogador/Observador.
-- A identidade raiz vem de auth.users + e-mail VERIFICADO, nunca do frontend.
create table if not exists public.platform_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'usuario'
    check (role in ('super_admin','admin','moderador','usuario')),
  permissions text[] not null default '{}'::text[],
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_admin_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id),
  target_id uuid references auth.users(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_access enable row level security;
alter table public.platform_admin_audit enable row level security;
revoke all on public.platform_access from public, anon, authenticated;
revoke all on public.platform_admin_audit from public, anon, authenticated;
revoke all on sequence public.platform_admin_audit_id_seq from public, anon, authenticated;

-- Bootstrap único: não depende da coluna profiles.role (editável pelo usuário).
insert into public.platform_access (user_id, role, permissions)
select u.id, 'super_admin', array['users.view','campaign_roles.manage']::text[]
from auth.users u
where u.id = '625c11dd-a04d-446c-ba77-c2509b7db633'::uuid
  and lower(u.email) = 'gui2k70@gmail.com'
  and u.email_confirmed_at is not null
on conflict (user_id) do nothing;

create or replace function public.is_platform_super_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.platform_access a
    where a.user_id = (select auth.uid()) and a.role = 'super_admin'
  );
$$;

create or replace function public.has_platform_permission(p_key text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_platform_super_admin()
      or exists (
        select 1 from public.platform_access a
        where a.user_id = (select auth.uid())
          and a.role in ('admin','moderador')
          and p_key = any(a.permissions)
      );
$$;

create or replace function public.platform_my_access()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'role', coalesce((select a.role from public.platform_access a where a.user_id=(select auth.uid())), 'usuario'),
    'permissions', coalesce((select to_jsonb(a.permissions) from public.platform_access a where a.user_id=(select auth.uid())), '[]'::jsonb)
  );
$$;

-- Diretório protegido; jamais expõe tokens, senhas ou segredos.
create or replace function public.platform_list_users(p_search text default '', p_limit integer default 50)
returns table (user_id uuid, email text, display_name text, global_role text, permissions text[], joined_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.has_platform_permission('users.view') then
    raise exception 'PLATFORM_FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text,
      coalesce(p.nome, split_part(u.email::text,'@',1))::text,
      coalesce(a.role,'usuario')::text, coalesce(a.permissions,'{}'::text[]),
      u.created_at
    from auth.users u
    left join public.profiles p on p.user_id=u.id
    left join public.platform_access a on a.user_id=u.id
    where p_search = ''
      or u.email ilike '%' || left(trim(p_search),100) || '%'
      or p.nome ilike '%' || left(trim(p_search),100) || '%'
    order by u.created_at desc
    limit least(greatest(p_limit,1),100);
end;
$$;

-- Somente o SUPER ADMIN concede/revoga os cargos globais.
-- A conta raiz não pode ser editada por este endpoint.
create or replace function public.platform_set_user_access(
  p_user_id uuid, p_role text, p_permissions text[] default '{}'::text[]
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_old jsonb;
  v_allowed text[] := array['users.view','campaign_roles.manage']::text[];
  v_permissions text[];
begin
  if not public.is_platform_super_admin() then
    raise exception 'PLATFORM_FORBIDDEN' using errcode='42501';
  end if;
  if p_role is null or p_role not in ('usuario','moderador','admin') then
    raise exception 'INVALID_PLATFORM_ROLE' using errcode='22023';
  end if;
  if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id) then
    raise exception 'UNKNOWN_USER' using errcode='22023';
  end if;
  if exists(select 1 from public.platform_access a where a.user_id=p_user_id and a.role='super_admin') then
    raise exception 'ROOT_ACCESS_IMMUTABLE' using errcode='42501';
  end if;
  if exists(select 1 from unnest(coalesce(p_permissions,'{}'::text[])) key
    where key is null or key <> all(v_allowed)) then
    raise exception 'INVALID_PERMISSION' using errcode='22023';
  end if;
  select coalesce(to_jsonb(a), '{}'::jsonb) into v_old
  from public.platform_access a where a.user_id=p_user_id;
  select coalesce(array_agg(distinct key), '{}'::text[])
  into v_permissions
  from unnest(coalesce(p_permissions,'{}'::text[])) key;

  insert into public.platform_access (user_id,role,permissions,updated_by,updated_at)
  values (p_user_id,p_role,case when p_role='usuario' then '{}'::text[] else v_permissions end,auth.uid(),now())
  on conflict(user_id) do update set role=excluded.role,permissions=excluded.permissions,
    updated_by=excluded.updated_by,updated_at=now();

  insert into public.platform_admin_audit(actor_id,target_id,action,details)
  values (auth.uid(),p_user_id,'set_platform_access',
    jsonb_build_object('before',coalesce(v_old,'{}'::jsonb),'role',p_role,'permissions',
      case when p_role='usuario' then '{}'::text[] else v_permissions end));
end;
$$;

create or replace function public.platform_list_campaign_members(p_search text default '', p_limit integer default 100)
returns table (campaign_id uuid, campaign_name text, member_user_id uuid, member_email text, member_name text, member_role text, member_status text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.has_platform_permission('campaign_roles.manage') then
    raise exception 'PLATFORM_FORBIDDEN' using errcode='42501';
  end if;
  return query
  select c.id,c.nome::text, cm.user_id,u.email::text,
    coalesce(p.nome,split_part(u.email::text,'@',1))::text,cm.role::text,cm.status::text
  from public.campaign_members cm
  join public.campaigns c on c.id=cm.campaign_id
  join auth.users u on u.id=cm.user_id
  left join public.profiles p on p.user_id=cm.user_id
  where p_search='' or c.nome ilike '%'||left(trim(p_search),100)||'%'
    or u.email ilike '%'||left(trim(p_search),100)||'%'
  order by c.criado_em desc, cm.joined_at
  limit least(greatest(p_limit,1),150);
end;
$$;

create or replace function public.platform_set_campaign_role(
  p_campaign_id uuid, p_user_id uuid, p_role text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_old text;
  v_owner uuid;
begin
  if not public.has_platform_permission('campaign_roles.manage') then
    raise exception 'PLATFORM_FORBIDDEN' using errcode='42501';
  end if;
  if p_role is null or p_role not in ('mestre','jogador','observador') then
    raise exception 'INVALID_CAMPAIGN_ROLE' using errcode='22023';
  end if;
  select c.owner_id into v_owner from public.campaigns c where c.id=p_campaign_id;
  select cm.role into v_old
  from public.campaign_members cm
  where cm.campaign_id=p_campaign_id and cm.user_id=p_user_id and cm.status='ativo'
  for update;
  if v_old is null then
    raise exception 'ACTIVE_MEMBERSHIP_REQUIRED' using errcode='22023';
  end if;
  if v_old='mestre' and p_role<>'mestre' then
    if p_user_id=v_owner then
      raise exception 'CANNOT_DEMOTE_CAMPAIGN_OWNER' using errcode='42501';
    end if;
    if (select count(*) from public.campaign_members cm
        where cm.campaign_id=p_campaign_id and cm.role='mestre' and cm.status='ativo')<=1 then
      raise exception 'LAST_CAMPAIGN_MASTER' using errcode='42501';
    end if;
  end if;
  update public.campaign_members cm set role=p_role
    where cm.campaign_id=p_campaign_id and cm.user_id=p_user_id;
  insert into public.platform_admin_audit(actor_id,target_id,action,details)
  values(auth.uid(),p_user_id,'set_campaign_role',
    jsonb_build_object('campaign_id',p_campaign_id,'before',v_old,'after',p_role));
end;
$$;

revoke all on function public.is_platform_super_admin() from public, anon;
revoke all on function public.has_platform_permission(text) from public, anon;
revoke all on function public.platform_my_access() from public, anon;
revoke all on function public.platform_list_users(text,integer) from public, anon;
revoke all on function public.platform_set_user_access(uuid,text,text[]) from public, anon;
revoke all on function public.platform_list_campaign_members(text,integer) from public, anon;
revoke all on function public.platform_set_campaign_role(uuid,uuid,text) from public, anon;
grant execute on function public.is_platform_super_admin() to authenticated;
grant execute on function public.has_platform_permission(text) to authenticated;
grant execute on function public.platform_my_access() to authenticated;
grant execute on function public.platform_list_users(text,integer) to authenticated;
grant execute on function public.platform_set_user_access(uuid,text,text[]) to authenticated;
grant execute on function public.platform_list_campaign_members(text,integer) to authenticated;
grant execute on function public.platform_set_campaign_role(uuid,uuid,text) to authenticated;
