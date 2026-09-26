-- Corrige a resolução da extensão pgcrypto no schema padrão do Supabase.
-- Não altera nem remove campanhas existentes.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  code text;
begin
  loop
    code := 'REINO-' || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12));
    exit when not exists (select 1 from public.campaigns where codigo_convite = code);
  end loop;
  return code;
end;
$$;
