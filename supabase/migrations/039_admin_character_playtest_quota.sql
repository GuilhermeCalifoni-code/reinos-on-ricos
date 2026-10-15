-- Administradores podem testar fichas sem consumir os limites do nivel gratuito.
-- Mantem as demais cotas do Clube da Vigilia e nao eleva privilegios.
-- Roda no banco SOMENTE apos backup verificado e plano de rollback.
-- O frontend e o trigger INSERT em public.personagens consultam a mesma funcao.

create or replace function public.community_limit_for_user(p_user_id uuid, limit_key text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with configured as (
    select coalesce(
      (
        select (p.limits ->> limit_key)::integer
        from public.community_plans p
        where p.ativo = true
          and p.rank = public.community_rank_for_user(p_user_id)
        order by p.ordem
        limit 1
      ),
      0
    ) as ordinary_limit
  )
  select case
    when limit_key = 'characters'
      and exists (
        select 1 from public.platform_access access
        where access.user_id = p_user_id
          and access.role in ('admin', 'super_admin')
      )
      then greatest(configured.ordinary_limit, 50)
    else configured.ordinary_limit
  end
  from configured;
$$;

revoke all on function public.community_limit_for_user(uuid,text) from public, anon, authenticated;
