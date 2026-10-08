-- Cada cópia de NPC/adversário no mapa guarda PV próprios. Os cadastros
-- de campaign_npcs/adversaries continuam modelos reutilizáveis.
alter table public.map_tokens
  add column if not exists hp_current integer,
  add column if not exists hp_max integer,
  add column if not exists area_radius_cells integer not null default 0;

alter table public.map_tokens
  add constraint map_tokens_hp_pair_valid
    check ((hp_current is null and hp_max is null)
      or (hp_current is not null and hp_max is not null
        and hp_max >= 1 and hp_max <= 99999
        and hp_current between 0 and hp_max)),
  add constraint map_tokens_area_radius_valid
    check (area_radius_cells between 0 and 30);

comment on column public.map_tokens.hp_current is 'PV da instância, independentes da ficha-base de NPC/adversário.';
comment on column public.map_tokens.hp_max is 'PV máximos desta cópia do token.';
comment on column public.map_tokens.area_radius_cells is 'Raio persistente da marcação circular de área de efeito, em células do mapa.';
-- Não modifica RLS: somente Mestre pode inserir, alterar ou remover marcadores
-- e recursos dos tokens. Jogadores usam RPC restrita para mover seu personagem.
