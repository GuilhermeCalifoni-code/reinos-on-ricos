-- Reinos Oníricos
-- Preferências de interface sincronizadas entre dispositivos.

alter table public.profiles
add column if not exists preferences jsonb not null default '{}'::jsonb;

alter table public.profiles
drop constraint if exists profiles_preferences_is_object;

alter table public.profiles
add constraint profiles_preferences_is_object
check (jsonb_typeof(preferences) = 'object');
