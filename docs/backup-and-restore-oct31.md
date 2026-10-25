# Backup e restauração — RO 9.0

**A execução do script NÃO foi realizada automaticamente.** A conexão de banco e a service-role são credenciais sensíveis que não estão disponíveis a ferramentas de backup neste chat. Sem esses dados no ambiente local do proprietário, não existe backup real verificado.

O script `scripts/backup-reinos-oniricos.sh` cria um arquivo criptografado AES-256 contendo um dump consistente do PostgreSQL e objetos dos buckets `reinos-oniricos`, `profile-avatars` e `system-art`. Requer `pg_dump`, Node.js com dependências instaladas, GPG e conexão ao banco.

Passos:
1. Em um computador confiável e privado, instale PostgreSQL client, gpg e as dependências via `npm ci`.
2. Obtenha `SUPABASE_DB_URL` diretamente nas configurações de conexão do seu próprio Supabase. Defina `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e uma frase forte `BACKUP_PASSPHRASE` no ambiente local **sem enviar a ninguém e sem gravar em arquivos versionados**.
3. Execute `bash scripts/backup-reinos-oniricos.sh`.
4. Confira o arquivo `.tar.gz.gpg` e o `.sha256`. Coloque uma cópia criptografada em local externo seguro com espaço suficiente.
5. Execute um **teste de restauração em banco de teste**, nunca na produção: `pg_restore --list postgres.dump` e uma restauração real em projeto descartável antes de confiar no procedimento.

Não faça upload de `postgres.dump`, pastas de Storage ou dos segredos para um repositório público.
Um rollback Vercel/GitHub NÃO restaura banco nem arquivos.
Mudanças de política em `storage.objects` exigem backup verificado e testes com Mestre/Jogador (inclusive paths conhecidos e URL assinada expirando).
