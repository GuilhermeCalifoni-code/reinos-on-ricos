-- Reinos Oníricos
-- Mantém public.profiles sincronizado quando e-mail ou metadados Auth mudarem.

drop trigger if exists on_auth_user_profile_updated on auth.users;
create trigger on_auth_user_profile_updated
after update of email, raw_user_meta_data on auth.users
for each row
execute function public.create_profile_for_auth_user();
