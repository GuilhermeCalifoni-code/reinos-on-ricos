-- Reinos Oníricos — liberação temporária de campanhas ilimitadas durante o playtest.
-- Mantém autenticação, RLS e vínculo automático do Mestre; remove apenas a cota de projetos.

create or replace function public.create_campaign(
  p_nome text,
  p_descricao text default '',
  p_imagem_url text default '',
  p_tipo text default 'campanha'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.campaigns(owner_id,nome,descricao,imagem_url,tipo,codigo_convite)
  values(
    auth.uid(),
    trim(p_nome),
    coalesce(p_descricao,''),
    nullif(p_imagem_url,''),
    p_tipo,
    public.generate_invite_code()
  )
  returning id into new_id;

  insert into public.campaign_members(campaign_id,user_id,role)
  values(new_id,auth.uid(),'mestre');

  return new_id;
end;
$$;

revoke all on function public.create_campaign(text,text,text,text) from public, anon;
grant execute on function public.create_campaign(text,text,text,text) to authenticated;
