-- Recuperação da cache PostgREST após a migration 006.
-- Não altera registros. Pare se a tabela não existir neste projeto Supabase.
do $$
begin
  if to_regclass('public.session_events') is null then
    raise exception 'public.session_events não existe neste projeto. Execute a migration 006 no projeto Supabase correto antes desta migration.';
  end if;
end $$;

notify pgrst, 'reload schema';
