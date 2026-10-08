-- Community permissions are separate from campaign membership and payments.
-- Login email always resolves through auth.users inside SECURITY DEFINER RPCs.

create table public.community_access_overrides (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'allowed' check (status in ('allowed','blocked')),
  manual_plan_id uuid references public.community_plans(id) on delete set null,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.community_access_overrides enable row level security;
revoke all on public.community_access_overrides from public, anon, authenticated;

-- User post submissions are always pending; only a delegated moderator can approve.
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  body text not null check (char_length(trim(body)) between 3 and 5000),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  review_note text not null default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index community_posts_status_created_idx on public.community_posts(status,created_at desc);
create index community_posts_author_created_idx on public.community_posts(author_id,created_at desc);
alter table public.community_posts enable row level security;
revoke all on public.community_posts from public, anon, authenticated;
grant select,insert on public.community_posts to authenticated;

-- Existing paid subscriptions and their payment-provider identifiers are untouched.
-- A manual level can add benefits/capacity, but never marks a subscription paid.
create or replace function public.community_rank_for_user(p_user_id uuid)
returns integer language sql stable security definer set search_path = ''
as $$
  select greatest(
    coalesce((select max(p.rank) from public.community_memberships m
      join public.community_plans p on p.id=m.plan_id
      where m.user_id=p_user_id and m.status in ('active','trialing')
        and p.ativo=true),0),
    coalesce((select p.rank from public.community_access_overrides o
      join public.community_plans p on p.id=o.manual_plan_id
      where o.user_id=p_user_id and o.status='allowed' and p.ativo=true),0)
  );
$$;

create or replace function public.community_current_rank()
returns integer language sql stable security definer set search_path = ''
as $$ select public.community_rank_for_user(auth.uid()); $$;

create or replace function public.community_has_permission(permission_key text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null
    and (
      (permission_key not like 'community.%' and permission_key not like 'creator.%')
      or not exists (select 1 from public.community_access_overrides o
        where o.user_id=auth.uid() and o.status='blocked')
    )
    and exists (
      select 1 from public.community_plans p
      where p.ativo=true and permission_key=any(p.permissions)
        and p.rank <= public.community_current_rank()
    );
$$;

-- Approved submissions are readable only for permitted members;
-- an author can see their own submissions and review status.
create policy "community posts view" on public.community_posts for select to authenticated
using (
  author_id=auth.uid()
  or public.has_platform_permission('community.posts.moderate')
  or (status='approved' and public.community_has_permission('community.read_public'))
);
create policy "community posts submit pending" on public.community_posts for insert to authenticated
with check (
  author_id=auth.uid() and status='pending'
  and review_note='' and reviewed_by is null and reviewed_at is null
  and public.community_has_permission('community.post')
);

-- Granting community permissions is delegable but only the root grants delegation.
create or replace function public.platform_set_user_access(
  p_user_id uuid,p_role text,p_permissions text[] default '{}'::text[]
)
returns void language plpgsql security definer set search_path=''
as $$
declare
  v_old jsonb;
  v_allowed text[] := array[
    'users.view','campaign_roles.manage',
    'community.members.manage','community.posts.moderate'
  ]::text[];
  v_permissions text[];
begin
  if not public.is_platform_super_admin() then
    raise exception 'PLATFORM_FORBIDDEN' using errcode='42501';
  end if;
  if p_role is null or p_role not in ('usuario','moderador','admin') then
    raise exception 'INVALID_PLATFORM_ROLE' using errcode='22023';
  end if;
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then
    raise exception 'UNKNOWN_USER' using errcode='22023';
  end if;
  if exists(select 1 from public.platform_access where user_id=p_user_id and role='super_admin') then
    raise exception 'ROOT_ACCESS_IMMUTABLE' using errcode='42501';
  end if;
  if exists(select 1 from unnest(coalesce(p_permissions,'{}'::text[])) k
    where k is null or k <> all(v_allowed)) then
    raise exception 'INVALID_PERMISSION' using errcode='22023';
  end if;
  select coalesce(to_jsonb(a),'{}'::jsonb) into v_old
    from public.platform_access a where a.user_id=p_user_id;
  select coalesce(array_agg(distinct k),'{}'::text[]) into v_permissions
    from unnest(coalesce(p_permissions,'{}'::text[])) k;
  insert into public.platform_access(user_id,role,permissions,updated_by,updated_at)
    values(p_user_id,p_role,case when p_role='usuario' then '{}'::text[] else v_permissions end,auth.uid(),now())
  on conflict(user_id) do update set role=excluded.role,permissions=excluded.permissions,
    updated_by=excluded.updated_by,updated_at=now();
  insert into public.platform_admin_audit(actor_id,target_id,action,details)
    values(auth.uid(),p_user_id,'set_platform_access',
      jsonb_build_object('before',coalesce(v_old,'{}'::jsonb),'role',p_role,'permissions',
        case when p_role='usuario' then '{}'::text[] else v_permissions end));
end;
$$;

create or replace function public.community_admin_lookup_user(p_email text)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare
  u record;
begin
  if not public.has_platform_permission('community.members.manage') then
    raise exception 'COMMUNITY_FORBIDDEN' using errcode='42501';
  end if;
  if p_email is null or char_length(trim(p_email))>254
    or position('@' in trim(p_email)) <= 1 then
    raise exception 'INVALID_EMAIL' using errcode='22023';
  end if;
  select auth_user.id,auth_user.email,
    coalesce(profile.nome,split_part(auth_user.email,'@',1)) as display_name,
    auth_user.email_confirmed_at is not null as email_confirmed,
    coalesce(pa.role,'usuario') as global_role,
    coalesce(o.status,'allowed') as access_status,
    manual.slug as manual_plan_slug,
    paid.slug as paid_plan_slug,
    public.community_rank_for_user(auth_user.id) as effective_rank
  into u from auth.users auth_user
    left join public.profiles profile on profile.user_id=auth_user.id
    left join public.platform_access pa on pa.user_id=auth_user.id
    left join public.community_access_overrides o on o.user_id=auth_user.id
    left join public.community_plans manual on manual.id=o.manual_plan_id
    left join public.community_memberships membership on membership.user_id=auth_user.id
      and membership.status in ('active','trialing')
    left join public.community_plans paid on paid.id=membership.plan_id
  where lower(auth_user.email)=lower(trim(p_email))
  limit 1;
  if u.id is null then return null; end if;
  return jsonb_build_object('user_id',u.id,'email',u.email,'display_name',u.display_name,
    'email_confirmed',u.email_confirmed,'global_role',u.global_role,
    'access_status',u.access_status,'manual_plan_slug',u.manual_plan_slug,
    'paid_plan_slug',u.paid_plan_slug,'effective_rank',u.effective_rank);
end;
$$;

create or replace function public.community_admin_set_access(
  p_user_id uuid,p_status text,p_manual_plan_slug text default null
)
returns void language plpgsql security definer set search_path=''
as $$
declare
  v_plan_id uuid;
  v_old jsonb;
begin
  if not public.has_platform_permission('community.members.manage') then
    raise exception 'COMMUNITY_FORBIDDEN' using errcode='42501';
  end if;
  if p_status is null or p_status not in ('allowed','blocked') then
    raise exception 'INVALID_COMMUNITY_STATUS' using errcode='22023';
  end if;
  if p_user_id is null or not exists(select 1 from auth.users u where u.id=p_user_id) then
    raise exception 'UNKNOWN_USER' using errcode='22023';
  end if;
  if p_user_id=auth.uid() or exists(
    select 1 from public.platform_access a
    where a.user_id=p_user_id and a.role='super_admin'
  ) then raise exception 'PROTECTED_ACCOUNT' using errcode='42501'; end if;
  if p_manual_plan_slug is not null then
    select id into v_plan_id from public.community_plans
      where slug=p_manual_plan_slug and ativo=true;
    if v_plan_id is null then raise exception 'INVALID_COMMUNITY_PLAN' using errcode='22023'; end if;
    if p_manual_plan_slug='aberto' then v_plan_id := null; end if;
  end if;
  select to_jsonb(o) into v_old from public.community_access_overrides o
    where o.user_id=p_user_id;
  if p_status='allowed' and v_plan_id is null then
    delete from public.community_access_overrides where user_id=p_user_id;
  else
    insert into public.community_access_overrides(user_id,status,manual_plan_id,updated_by,updated_at)
      values(p_user_id,p_status,v_plan_id,auth.uid(),now())
    on conflict(user_id) do update set status=excluded.status,
      manual_plan_id=excluded.manual_plan_id,updated_by=excluded.updated_by,updated_at=now();
  end if;
  insert into public.platform_admin_audit(actor_id,target_id,action,details)
    values(auth.uid(),p_user_id,'community_set_access',
      jsonb_build_object('before',coalesce(v_old,'{}'::jsonb),
        'status',p_status,'manual_plan_slug',p_manual_plan_slug,
        'manual_grant',v_plan_id is not null));
end;
$$;

create or replace function public.community_my_access()
returns jsonb language sql stable security definer set search_path=''
as $$
  select jsonb_build_object(
    'status',coalesce((select o.status from public.community_access_overrides o
      where o.user_id=auth.uid()),'allowed'),
    'effective_rank',public.community_rank_for_user(auth.uid()),
    'manual_plan_slug',(select p.slug from public.community_access_overrides o
      join public.community_plans p on p.id=o.manual_plan_id where o.user_id=auth.uid())
  ) where auth.uid() is not null;
$$;

create or replace function public.community_admin_list_posts(
  p_status text default 'pending',p_limit integer default 60
)
returns table(post_id uuid,author_email text,author_name text,title text,body text,
  status text,review_note text,created_at timestamptz)
language plpgsql stable security definer set search_path=''
as $$
begin
  if not public.has_platform_permission('community.posts.moderate') then
    raise exception 'COMMUNITY_FORBIDDEN' using errcode='42501';
  end if;
  if p_status not in ('pending','approved','rejected','all') then
    raise exception 'INVALID_POST_STATUS' using errcode='22023'; end if;
  return query select p.id,u.email::text,
    coalesce(prof.nome,split_part(u.email,'@',1))::text,p.title,p.body,p.status,p.review_note,p.created_at
  from public.community_posts p join auth.users u on u.id=p.author_id
    left join public.profiles prof on prof.user_id=p.author_id
  where p_status='all' or p.status=p_status
  order by p.created_at desc
  limit least(greatest(p_limit,1),100);
end;
$$;

create or replace function public.community_admin_review_post(
  p_post_id uuid,p_decision text,p_note text default ''
)
returns void language plpgsql security definer set search_path=''
as $$
declare
  v_author uuid;
  v_old text;
begin
  if not public.has_platform_permission('community.posts.moderate') then
    raise exception 'COMMUNITY_FORBIDDEN' using errcode='42501';
  end if;
  if p_decision not in ('approved','rejected') then
    raise exception 'INVALID_REVIEW_DECISION' using errcode='22023';
  end if;
  if char_length(coalesce(p_note,''))>500 then
    raise exception 'REVIEW_NOTE_TOO_LONG' using errcode='22023';
  end if;
  select author_id,status into v_author,v_old from public.community_posts
    where id=p_post_id for update;
  if not found then raise exception 'POST_NOT_FOUND' using errcode='22023'; end if;
  if v_old=p_decision then return; end if;
  update public.community_posts set status=p_decision,review_note=left(coalesce(p_note,''),500),
    reviewed_by=auth.uid(),reviewed_at=now() where id=p_post_id;
  insert into public.platform_admin_audit(actor_id,target_id,action,details)
    values(auth.uid(),v_author,'community_review_post',
      jsonb_build_object('post_id',p_post_id,'before',v_old,'after',p_decision,'note',p_note));
end;
$$;

revoke all on function public.community_admin_lookup_user(text) from public,anon,authenticated;
revoke all on function public.community_admin_set_access(uuid,text,text) from public,anon,authenticated;
revoke all on function public.community_my_access() from public,anon,authenticated;
revoke all on function public.community_admin_list_posts(text,integer) from public,anon,authenticated;
revoke all on function public.community_admin_review_post(uuid,text,text) from public,anon,authenticated;
grant execute on function public.community_admin_lookup_user(text) to authenticated;
grant execute on function public.community_admin_set_access(uuid,text,text) to authenticated;
grant execute on function public.community_my_access() to authenticated;
grant execute on function public.community_admin_list_posts(text,integer) to authenticated;
grant execute on function public.community_admin_review_post(uuid,text,text) to authenticated;
