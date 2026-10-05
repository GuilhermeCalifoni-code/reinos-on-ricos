-- Helpers de autorização da Comunidade.
-- Centraliza o nível atual e a verificação de permissões para futuras RLS/recursos.

create or replace function public.community_current_rank()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.rank
      from public.community_memberships m
      join public.community_plans p on p.id = m.plan_id
      where m.user_id = auth.uid()
        and m.status in ('active', 'trialing')
        and p.ativo = true
      order by p.rank desc
      limit 1
    ),
    0
  );
$$;

create or replace function public.community_has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_plans p
    where p.ativo = true
      and permission_key = any(p.permissions)
      and (
        p.rank = 0
        or p.rank <= public.community_current_rank()
      )
  );
$$;

revoke all on function public.community_current_rank() from public;
revoke all on function public.community_has_permission(text) from public;

grant execute on function public.community_current_rank() to anon, authenticated;
grant execute on function public.community_has_permission(text) to anon, authenticated;
