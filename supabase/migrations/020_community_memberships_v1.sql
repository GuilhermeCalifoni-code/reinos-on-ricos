-- Reinos Oníricos — Comunidade, níveis de apoio e permissões
-- Catálogo real de planos + estado de assinatura + lista de interesse.

create table if not exists public.community_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  tagline text not null default '',
  descricao text not null default '',
  rank integer not null unique check (rank >= 0),
  preco_mensal_centavos integer not null default 0 check (preco_mensal_centavos >= 0),
  preco_anual_centavos integer not null default 0 check (preco_anual_centavos >= 0),
  destaque boolean not null default false,
  badge text,
  permissions text[] not null default '{}',
  benefits jsonb not null default '[]'::jsonb check (jsonb_typeof(benefits) = 'array'),
  kit jsonb not null default '{}'::jsonb check (jsonb_typeof(kit) = 'object'),
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.community_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id uuid not null references public.community_plans(id),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','expired')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','annual','none')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.community_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.community_plans(id) on delete cascade,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','annual')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, plan_id)
);

alter table public.community_plans enable row level security;
alter table public.community_memberships enable row level security;
alter table public.community_waitlist enable row level security;

drop policy if exists "community plans are readable" on public.community_plans;
create policy "community plans are readable"
on public.community_plans
for select
to anon, authenticated
using (ativo = true);

drop policy if exists "users read own community membership" on public.community_memberships;
create policy "users read own community membership"
on public.community_memberships
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users read own community waitlist" on public.community_waitlist;
create policy "users read own community waitlist"
on public.community_waitlist
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users join community waitlist" on public.community_waitlist;
create policy "users join community waitlist"
on public.community_waitlist
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own community waitlist" on public.community_waitlist;
create policy "users update own community waitlist"
on public.community_waitlist
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users leave own community waitlist" on public.community_waitlist;
create policy "users leave own community waitlist"
on public.community_waitlist
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists community_memberships_plan_idx on public.community_memberships(plan_id);
create index if not exists community_waitlist_plan_idx on public.community_waitlist(plan_id);

insert into public.community_plans (
  slug, nome, tagline, descricao, rank,
  preco_mensal_centavos, preco_anual_centavos,
  destaque, badge, permissions, benefits, kit, ordem
)
values
(
  'aberto',
  'Aberto',
  'O Reinos Oníricos continua jogável de verdade sem assinatura.',
  'Para entrar na comunidade, acompanhar o projeto e usar tudo que é essencial para jogar Reinos Oníricos.',
  0, 0, 0, false, 'Desvelado',
  array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  '[
    {"key":"core","label":"Regras, fichas, campanhas e mesa ao vivo","description":"Os recursos essenciais de jogo continuam disponíveis.","group":"Plataforma"},
    {"key":"community","label":"Comunidade pública","description":"Acompanhe posts, mesas abertas e novidades.","group":"Comunidade"},
    {"key":"posts","label":"Publicar e interagir","description":"Participe das conversas e compartilhe experiências.","group":"Comunidade"},
    {"key":"public_library","label":"Arquivo público","description":"Acesse materiais gratuitos liberados para todos.","group":"Materiais"}
  ]'::jsonb,
  '{"nome":"Arquivo Aberto","descricao":"Materiais gratuitos e referências oficiais liberadas para toda a comunidade.","itens":["materiais públicos","referências oficiais","novidades do projeto"]}'::jsonb,
  0
),
(
  'vigilia',
  'Vigília',
  'Para quem quer apoiar o projeto e receber um pacote mensal útil de verdade.',
  'A primeira camada de apoio: identidade na comunidade, arquivo reservado e um kit digital mensal.',
  1, 1490, 14900, false, 'Vigília',
  array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'community.supporter_badge',
    'community.private_lounge',
    'content.early_access',
    'kits.vigilia_monthly',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  '[
    {"key":"all_open","label":"Tudo do plano Aberto","description":"Sem retirar recursos essenciais da plataforma.","group":"Base"},
    {"key":"badge","label":"Selo Vigília no perfil","description":"Identidade visual exclusiva de apoiador.","group":"Comunidade"},
    {"key":"lounge","label":"Salão da Vigília","description":"Espaço reservado para apoiadores.","group":"Comunidade"},
    {"key":"early","label":"Acesso antecipado","description":"Veja novidades, recursos e playtests antes do público.","group":"Projeto"},
    {"key":"kit","label":"Kit Ecos da Vigília","description":"Um pacote digital mensal de apoio à mesa.","group":"Kits"}
  ]'::jsonb,
  '{"nome":"Kit Ecos da Vigília","descricao":"Pacote mensal enxuto para enriquecer sessões sem sobrecarregar o Mestre.","itens":["4 tokens temáticos","2 handouts editáveis","1 prop ou pista visual","1 wallpaper/arte de atmosfera"]}'::jsonb,
  1
),
(
  'circulo',
  'Círculo',
  'O melhor equilíbrio para Mestres, criadores e mesas frequentes.',
  'Mais materiais, ferramentas de criação e influência direta nos próximos passos do projeto.',
  2, 2990, 29900, true, 'Círculo',
  array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'community.supporter_badge',
    'community.private_lounge',
    'community.vote_roadmap',
    'content.early_access',
    'content.playtest_priority',
    'content.hires_assets',
    'kits.vigilia_monthly',
    'kits.circulo_monthly',
    'creator.publish_pack',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  '[
    {"key":"all_vigilia","label":"Tudo do nível Vigília","description":"Inclui todos os benefícios anteriores.","group":"Base"},
    {"key":"roadmap","label":"Voto no roadmap","description":"Participe de enquetes que ajudam a priorizar recursos e conteúdos.","group":"Projeto"},
    {"key":"playtest","label":"Prioridade em playtests","description":"Receba chamadas e versões de teste antes da abertura geral.","group":"Projeto"},
    {"key":"hires","label":"Assets em alta resolução","description":"Versões sem compressão de mapas, handouts e artes incluídas nos kits.","group":"Materiais"},
    {"key":"publish","label":"Publicar packs na comunidade","description":"Ferramenta para organizar e compartilhar seu próprio material.","group":"Criador"},
    {"key":"kit","label":"Kit do Mestre","description":"Pacote mensal maior, pensado para preparar sessões rapidamente.","group":"Kits"}
  ]'::jsonb,
  '{"nome":"Kit do Mestre","descricao":"Um drop mensal completo para reduzir preparação e aumentar repertório de mesa.","itens":["1 mapa em versões limpa e marcada","10 tokens temáticos","6 handouts e pistas","1 cena pronta ou encontro","1 adversário ou NPC pronto","assets em alta resolução"]}'::jsonb,
  2
),
(
  'guardiao',
  'Guardião',
  'Para quem quer sustentar o universo e ter acesso ao arquivo premium inteiro.',
  'A camada máxima de apoio, com arquivo histórico, drops especiais e reconhecimento permanente dentro da comunidade.',
  3, 4990, 49900, false, 'Guardião',
  array[
    'community.read_public',
    'community.post',
    'community.find_tables',
    'community.public_library',
    'community.supporter_badge',
    'community.private_lounge',
    'community.vote_roadmap',
    'community.guardian_badge',
    'community.name_credit',
    'content.early_access',
    'content.playtest_priority',
    'content.hires_assets',
    'kits.vigilia_monthly',
    'kits.circulo_monthly',
    'kits.full_archive',
    'kits.seasonal_guardian',
    'creator.publish_pack',
    'creator.featured_profile',
    'core.rules',
    'core.characters',
    'core.campaigns',
    'core.live_table'
  ],
  '[
    {"key":"all_circulo","label":"Tudo do nível Círculo","description":"Inclui todos os benefícios anteriores.","group":"Base"},
    {"key":"archive","label":"Arquivo premium completo","description":"Acesso aos kits premium anteriores enquanto a assinatura estiver ativa.","group":"Materiais"},
    {"key":"seasonal","label":"Drops sazonais do Guardião","description":"Mega-kits especiais em lançamentos e eventos do projeto.","group":"Kits"},
    {"key":"guardian_badge","label":"Insígnia Guardião","description":"Selo máximo de apoio no perfil e em áreas da comunidade.","group":"Comunidade"},
    {"key":"featured","label":"Perfil de criador em destaque","description":"Maior visibilidade para packs e materiais publicados.","group":"Criador"},
    {"key":"credit","label":"Crédito de apoiador","description":"Nome no mural digital de apoiadores do projeto, com opção de ocultar.","group":"Projeto"}
  ]'::jsonb,
  '{"nome":"Arquivo do Guardião","descricao":"Todo o arquivo premium mais drops de grande porte criados para momentos especiais.","itens":["todos os Kits da Vigília","todos os Kits do Mestre","arquivo histórico premium","mega-kit sazonal","variações extras de mapas e handouts","coleções temáticas especiais"]}'::jsonb,
  3
)
on conflict (slug) do update set
  nome = excluded.nome,
  tagline = excluded.tagline,
  descricao = excluded.descricao,
  rank = excluded.rank,
  preco_mensal_centavos = excluded.preco_mensal_centavos,
  preco_anual_centavos = excluded.preco_anual_centavos,
  destaque = excluded.destaque,
  badge = excluded.badge,
  permissions = excluded.permissions,
  benefits = excluded.benefits,
  kit = excluded.kit,
  ativo = true,
  ordem = excluded.ordem,
  atualizado_em = now();
