// Rodar: npm run test:migracao (também roda no CI)
// Monta um banco do zero (PGlite) e aplica TODAS as migrações em ordem.
// Se alguma falhar, o teste falha. Garante que o repositório recria o banco.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../migrations', import.meta.url));
const db = new PGlite({ extensions: { pgcrypto } });

// Peças que o Supabase já traz prontas (auth, storage, papéis, realtime).
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin; create role supabase_admin nologin;
create role authenticator nologin; create role supabase_storage_admin nologin; create role supabase_auth_admin nologin;
create schema auth; create schema storage; create schema extensions; create schema realtime;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}', created_at timestamptz default now(), updated_at timestamptz default now(), email_confirmed_at timestamptz, last_sign_in_at timestamptz, deleted_at timestamptz, is_anonymous boolean default false);
create table auth.identities (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), provider text, identity_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true),'') $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.email() returns text language sql stable as $$ select auth.jwt()->>'email' $$;
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[], created_at timestamptz default now(), updated_at timestamptz default now(), owner uuid);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid, metadata jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
create function storage.filename(name text) returns text language sql immutable as $$ select (string_to_array(name,'/'))[array_length(string_to_array(name,'/'),1)] $$;
create function storage.extension(name text) returns text language sql immutable as $$ select reverse(split_part(reverse(name),'.',1)) $$;
create publication supabase_realtime;
`);

const arquivos = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const falhas: string[] = [];
for (const f of arquivos) {
  try {
    await db.exec(readFileSync(`${DIR}/${f}`, 'utf8'));
  } catch (e) {
    falhas.push(`${f} → ${(e as Error).message.split('\n')[0]}`);
  }
}

if (falhas.length) {
  console.error(`Cadeia de migrações quebrada (${arquivos.length - falhas.length}/${arquivos.length}):`);
  for (const f of falhas) console.error('  FALHA', f);
  process.exit(1);
}
console.log(`OK cadeia completa: ${arquivos.length}/${arquivos.length} migrações aplicadas do zero`);
