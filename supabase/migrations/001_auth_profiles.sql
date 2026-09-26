create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default 'Desvelado',
  avatar_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists atualizado_em timestamptz not null default now();
create unique index if not exists profiles_user_id_unique on public.profiles(user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.atualizado_em = now(); return new; end; $$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (user_id, nome) values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(coalesce(new.email, 'Desvelado'), '@', 1))) on conflict (user_id) do nothing; return new; end; $$;
drop trigger if exists auth_user_profile_created on auth.users;
create trigger auth_user_profile_created after insert on auth.users for each row execute function public.create_profile_for_auth_user();
