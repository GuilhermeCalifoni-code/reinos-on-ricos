-- Reinos Oníricos — planos enxutos baseados em capacidade
-- Remove a obrigação de produzir kits mensais e transforma apoio em:
-- PDFs oficiais + capacidade maior de uso da plataforma + identidade de apoiador.

alter table public.community_plans
  add column if not exists limits jsonb not null default '{}'::jsonb
  check (jsonb_typeof(limits) = 'object');

alter table public.community_plans
  add column if not exists digital_entitlements jsonb not null default '[]'::jsonb
  check (jsonb_typeof(digital_entitlements) = 'array');

update public.community_plans
set
  tagline = 'Conheça o sistema e jogue uma mesa completa sem pagar.',
  descricao = 'Acesso essencial ao Reinos Oníricos, ao Compêndio online e à comunidade pública.',
  preco_mensal_centavos = 0,
  preco_anual_centavos = 0,
  destaque = false,
  badge = 'Desvelado',
  permissions = array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  benefits = '[
    {"key":"compendium","label":"Compêndio online","description":"Consulta completa das regras dentro da plataforma.","group":"Sistema"},
    {"key":"characters","label":"Até 2 personagens","description":"Duas fichas salvas na nuvem.","group":"Capacidade"},
    {"key":"projects","label":"1 projeto de mesa","description":"Uma campanha, one-shot ou playtest salvo por vez.","group":"Capacidade"},
    {"key":"community","label":"Comunidade pública","description":"Acesso aos espaços e materiais públicos.","group":"Comunidade"}
  ]'::jsonb,
  kit = '{}'::jsonb,
  limits = '{"characters":2,"projects":1}'::jsonb,
  digital_entitlements = '[]'::jsonb,
  atualizado_em = now()
where slug = 'aberto';

update public.community_plans
set
  tagline = 'O primeiro nível para quem joga com frequência e quer o livro sempre à mão.',
  descricao = 'Mais espaço na plataforma, identidade de apoiador e o Livro Básico em PDF.',
  preco_mensal_centavos = 1490,
  preco_anual_centavos = 14900,
  destaque = false,
  badge = 'Vigília',
  permissions = array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'community.supporter_badge',
    'downloads.rulebook_pdf',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  benefits = '[
    {"key":"rulebook","label":"Livro Básico em PDF","description":"Download oficial do livro de regras enquanto o nível estiver ativo.","group":"Biblioteca"},
    {"key":"characters","label":"Até 8 personagens","description":"Espaço suficiente para jogadores, NPCs pessoais e diferentes mesas.","group":"Capacidade"},
    {"key":"projects","label":"Até 3 projetos de mesa","description":"Campanhas, one-shots e playtests compartilham o mesmo limite.","group":"Capacidade"},
    {"key":"badge","label":"Selo Vigília","description":"Identidade de apoiador no perfil e na comunidade.","group":"Comunidade"}
  ]'::jsonb,
  kit = '{}'::jsonb,
  limits = '{"characters":8,"projects":3}'::jsonb,
  digital_entitlements = '["livro_basico_pdf"]'::jsonb,
  atualizado_em = now()
where slug = 'vigilia';

update public.community_plans
set
  tagline = 'Para Mestres que mantêm várias mesas e querem toda a referência principal em PDF.',
  descricao = 'Capacidade ampliada, Livro Básico e Livro de Adversários em PDF.',
  preco_mensal_centavos = 2990,
  preco_anual_centavos = 29900,
  destaque = true,
  badge = 'Círculo',
  permissions = array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'community.supporter_badge',
    'downloads.rulebook_pdf',
    'downloads.adversary_book_pdf',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  benefits = '[
    {"key":"rulebook","label":"Livro Básico em PDF","description":"Incluído no nível.","group":"Biblioteca"},
    {"key":"adversaries","label":"Livro de Adversários em PDF","description":"Bestiário oficial para preparação de mesas.","group":"Biblioteca"},
    {"key":"characters","label":"Até 20 personagens","description":"Biblioteca ampla de Desvelados e fichas pessoais.","group":"Capacidade"},
    {"key":"projects","label":"Até 10 projetos de mesa","description":"Campanhas, one-shots e playtests no mesmo espaço.","group":"Capacidade"},
    {"key":"badge","label":"Selo Círculo","description":"Identidade de apoiador avançado.","group":"Comunidade"}
  ]'::jsonb,
  kit = '{}'::jsonb,
  limits = '{"characters":20,"projects":10}'::jsonb,
  digital_entitlements = '["livro_basico_pdf","livro_adversarios_pdf"]'::jsonb,
  atualizado_em = now()
where slug = 'circulo';

update public.community_plans
set
  tagline = 'Capacidade quase sem preocupação e acesso à biblioteca oficial completa.',
  descricao = 'Para grupos, Mestres muito ativos e apoiadores que querem acompanhar todo material oficial publicado.',
  preco_mensal_centavos = 4990,
  preco_anual_centavos = 49900,
  destaque = false,
  badge = 'Guardião',
  permissions = array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'community.supporter_badge',
    'community.guardian_badge',
    'community.name_credit',
    'downloads.rulebook_pdf',
    'downloads.adversary_book_pdf',
    'downloads.all_official_pdfs',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  benefits = '[
    {"key":"library","label":"Biblioteca oficial de PDFs","description":"Livro Básico, Livro de Adversários e demais PDFs oficiais liberados para o nível.","group":"Biblioteca"},
    {"key":"characters","label":"Até 50 personagens","description":"Capacidade alta sem expor a infraestrutura a uso ilimitado.","group":"Capacidade"},
    {"key":"projects","label":"Até 25 projetos de mesa","description":"Campanhas, one-shots e playtests compartilham o limite.","group":"Capacidade"},
    {"key":"badge","label":"Insígnia Guardião","description":"Maior identificação de apoio dentro da comunidade.","group":"Comunidade"},
    {"key":"credit","label":"Crédito de apoiador","description":"Nome no mural digital, com opção de permanecer anônimo.","group":"Comunidade"}
  ]'::jsonb,
  kit = '{}'::jsonb,
  limits = '{"characters":50,"projects":25}'::jsonb,
  digital_entitlements = '["livro_basico_pdf","livro_adversarios_pdf","biblioteca_oficial_pdf"]'::jsonb,
  atualizado_em = now()
where slug = 'guardiao';

create or replace function public.community_rank_for_user(p_user_id uuid)
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
      where m.user_id = p_user_id
        and m.status in ('active', 'trialing')
        and p.ativo = true
      order by p.rank desc
      limit 1
    ),
    0
  );
$$;

create or replace function public.community_limit_for_user(p_user_id uuid, limit_key text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
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
  );
$$;

create or replace function public.community_limit_int(limit_key text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select public.community_limit_for_user(auth.uid(), limit_key);
$$;

revoke all on function public.community_rank_for_user(uuid) from public, anon, authenticated;
revoke all on function public.community_limit_for_user(uuid,text) from public, anon, authenticated;
revoke all on function public.community_limit_int(text) from public;

grant execute on function public.community_limit_int(text) to authenticated;

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
  max_projects integer;
  current_projects integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  max_projects := public.community_limit_for_user(auth.uid(), 'projects');
  select count(*)::integer into current_projects
  from public.campaigns
  where owner_id = auth.uid();

  if current_projects >= max_projects then
    raise exception 'PROJECT_LIMIT_REACHED:%', max_projects;
  end if;

  insert into public.campaigns(owner_id,nome,descricao,imagem_url,tipo,codigo_convite)
  values(auth.uid(),trim(p_nome),coalesce(p_descricao,''),nullif(p_imagem_url,''),p_tipo,public.generate_invite_code())
  returning id into new_id;

  insert into public.campaign_members(campaign_id,user_id,role)
  values(new_id,auth.uid(),'mestre');

  return new_id;
end;
$$;

revoke all on function public.create_campaign(text,text,text,text) from public, anon;
grant execute on function public.create_campaign(text,text,text,text) to authenticated;

create or replace function public.enforce_character_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  max_characters integer;
  current_characters integer;
begin
  if new.owner_user_id is null then
    return new;
  end if;

  max_characters := public.community_limit_for_user(new.owner_user_id, 'characters');

  select count(*)::integer into current_characters
  from public.personagens
  where owner_user_id = new.owner_user_id;

  if current_characters >= max_characters then
    raise exception 'CHARACTER_LIMIT_REACHED:%', max_characters;
  end if;

  return new;
end;
$$;

drop trigger if exists personagens_enforce_plan_limit on public.personagens;
create trigger personagens_enforce_plan_limit
before insert on public.personagens
for each row
execute function public.enforce_character_plan_limit();

revoke all on function public.enforce_character_plan_limit() from public, anon, authenticated;
