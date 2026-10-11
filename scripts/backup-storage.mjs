// Run ONLY from an authorized local machine, never in browser code.
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const destination = process.argv[2];
if (!url || !key || !destination) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e destino são obrigatórios');
}
const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const buckets = ['reinos-oniricos', 'profile-avatars', 'system-art'];
const outputRoot = resolve(destination);
const manifest = { createdAt: new Date().toISOString(), buckets: {}, objects: [] };
await mkdir(outputRoot, { recursive: true });

async function dumpFolder(bucket, folder = '') {
  let offset = 0;
  const perPage = 100;
  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(folder, { limit: perPage, offset, sortBy: {column:'name', order:'asc'} });
    if (error) throw new Error(`Listagem ${bucket}/${folder}: ${error.message}`);
    for (const item of data || []) {
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (!item.id) {
        await dumpFolder(bucket, path);
        continue;
      }
      const local = resolve(outputRoot, bucket, path);
      if (!relative(resolve(outputRoot, bucket), local) || relative(resolve(outputRoot, bucket), local).startsWith('..')) {
        throw new Error('Caminho de Storage inválido');
      }
      const { data: content, error: downloadError } = await client.storage.from(bucket).download(path);
      if (downloadError || !content) throw new Error(`Download ${bucket}/${path}: ${downloadError?.message}`);
      const bytes = Buffer.from(await content.arrayBuffer());
      await mkdir(dirname(local), {recursive:true});
      await writeFile(local, bytes, {mode:0o600});
      manifest.objects.push({ bucket, path, size:bytes.byteLength, sha256:createHash('sha256').update(bytes).digest('hex') });
    }
    if (!data || data.length < perPage) break;
    offset += perPage;
  }
}
for (const bucket of buckets) {
  await dumpFolder(bucket);
  manifest.buckets[bucket] = manifest.objects.filter(object => object.bucket === bucket).length;
}
await writeFile(join(outputRoot, 'storage-manifest.json'), JSON.stringify(manifest, null, 2), {mode:0o600});
process.stdout.write(`Arquivos exportados: ${manifest.objects.length}.\n`);
