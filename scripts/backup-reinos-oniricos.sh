#!/usr/bin/env bash
# Encrypted PostgreSQL + Supabase Storage backup (never store unencrypted data in GitHub).
set -euo pipefail
umask 077
: "${SUPABASE_DB_URL:?Defina SUPABASE_DB_URL apenas em variavel de ambiente}"
: "${SUPABASE_URL:?Defina SUPABASE_URL apenas em variavel de ambiente}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Defina SUPABASE_SERVICE_ROLE_KEY apenas em variavel de ambiente}"
: "${BACKUP_PASSPHRASE:?Defina uma frase secreta forte e guarde-a fora do repositorio}"
for bin in pg_dump gpg tar node; do command -v "$bin" >/dev/null || { echo "Falta dependencia: $bin"; exit 1; }; done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="${BACKUP_OUTPUT_DIR:-$PWD/backups}"
mkdir -p "$OUTPUT_DIR"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$OUTPUT_DIR/reinos-oniricos-$STAMP.tar.gz.gpg"

echo 'Exportando PostgreSQL...'
PGSSLMODE=require pg_dump --dbname="$SUPABASE_DB_URL" --format=custom --no-owner --no-acl --file="$TEMP_DIR/postgres.dump"
echo 'Exportando objetos do Storage...'
(cd "$REPO_ROOT" && node scripts/backup-storage.mjs "$TEMP_DIR/storage")
printf '%s\n' "$STAMP" > "$TEMP_DIR/backup-created-utc.txt"
echo 'Criptografando backup...'
tar -C "$TEMP_DIR" -czf - postgres.dump storage backup-created-utc.txt | \
  gpg --batch --yes --pinentry-mode loopback --passphrase-fd 3 --symmetric --cipher-algo AES256 \
      -o "$ARCHIVE" 3<<< "$BACKUP_PASSPHRASE"

echo 'Verificando se o arquivo criptografado pode ser aberto...'
gpg --batch --yes --pinentry-mode loopback --passphrase-fd 3 --decrypt "$ARCHIVE" 3<<< "$BACKUP_PASSPHRASE" \
    | tar -tzf - >/dev/null
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
echo "Backup verificado: $ARCHIVE"
echo 'Guarde o backup criptografado e a senha em locais diferentes. NUNCA publique no GitHub.'
