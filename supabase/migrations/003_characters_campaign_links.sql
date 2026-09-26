create table if not exists public.personagens (
  id text primary key,
  nome text not null,
  jogador text not null default 'Jogador',
  conceito text not null default 'Lúcido',
  nivel integer not null default 1,
  atributos jsonb not null default '{}'::jsonb,
  atributo_principal text not null default 'mente',
  resistencia integer not null default 7, defesa integer not null default 10,
  vida_atual integer not null default 3, vida_maxima integer not null default 3,
  foco_atual integer not null default 4, foco_maximo integer not null default 4,
  protecao_onirica_atual integer not null default 2, protecao_onirica_maxima integer not null default 2,
  ruptura integer not null default 0, historico_ruptura jsonb not null default '[]'::jsonb,
  dominios jsonb not null default '{}'::jsonb, ancoragem text not null default '',
  vinculos jsonb not null default '[]'::jsonb, equipamentos jsonb not null default '[]'::jsonb, recursos jsonb not null default '[]'::jsonb,
  percepcao_onirica_notas text default '', anotacoes_gerais text default '',
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
alter table public.personagens add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;
alter table public.personagens add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
create index if not exists personagens_campaign_idx on public.personagens(campaign_id);
create index if not exists personagens_owner_idx on public.personagens(owner_user_id);
do $$ begin if not exists (select 1 from pg_constraint where conname = 'campaign_members_character_fk') then alter table public.campaign_members add constraint campaign_members_character_fk foreign key (character_id) references public.personagens(id) on delete set null; end if; end $$;

create or replace function public.link_own_character_to_membership(p_campaign_id uuid, p_character_id text) returns void language plpgsql security definer set search_path = public as $$
begin if not public.is_campaign_member(p_campaign_id) then raise exception 'campaign membership required'; end if; if not exists(select 1 from public.personagens where id=p_character_id and campaign_id=p_campaign_id and owner_user_id=auth.uid()) then raise exception 'character is not owned by current user in this campaign'; end if; update public.campaign_members set character_id=p_character_id where campaign_id=p_campaign_id and user_id=auth.uid(); end; $$;
