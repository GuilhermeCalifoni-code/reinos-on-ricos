import { supabase } from '../../lib/supabaseClient';

const BUCKET = 'reinos-oniricos';
const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  return supabase;
};

const sanitize = (name: string) => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
const STORAGE_PREFIX = 'storage:';
const validateImage = (file: File) => {
  if (!file.type.startsWith('image/')) throw new Error('Selecione uma imagem PNG, JPG, WEBP ou GIF.');
  if (file.size > 15 * 1024 * 1024) throw new Error('A imagem excede o limite de 15 MB.');
};

export const campaignAssetService = {
  isStorageRef(value?: string) {
    return Boolean(value?.startsWith(STORAGE_PREFIX));
  },

  toStorageRef(path: string) {
    return `${STORAGE_PREFIX}${path}`;
  },

  fromStorageRef(value: string) {
    return value.startsWith(STORAGE_PREFIX) ? value.slice(STORAGE_PREFIX.length) : value;
  },

  async resolveImageRef(value?: string) {
    if (!value) return '';
    if (!value.startsWith(STORAGE_PREFIX)) return value;
    return this.signedUrl(this.fromStorageRef(value));
  },

  isRemoteCampaignId(campaignId: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId);
  },

  async uploadCampaignCover(campaignId: string, file: File) {
    validateImage(file);
    const extName = sanitize(file.name || 'capa');
    const path = `campaigns/${campaignId}/covers/${Date.now()}-${extName}`;
    const { error } = await client().storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    return path;
  },

  async uploadSceneImage(campaignId: string, file: File) {
    validateImage(file);
    const extName = sanitize(file.name || 'cena');
    const path = `campaigns/${campaignId}/scenes/${Date.now()}-${extName}`;
    const { error } = await client().storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    return path;
  },

  async uploadMap(campaignId: string, file: File) {
    const extName = sanitize(file.name || 'mapa');
    const path = `campaigns/${campaignId}/maps/${Date.now()}-${extName}`;
    const { error } = await client().storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    return path;
  },

  async uploadHandout(campaignId: string, file: File) {
    const extName = sanitize(file.name || 'arquivo');
    const path = `campaigns/${campaignId}/handouts/${Date.now()}-${extName}`;
    const { error } = await client().storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    return path;
  },

  async signedUrl(path: string, expiresIn = 3600) {
    const { data, error } = await client().storage.from(BUCKET).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  async remove(path: string) {
    const { error } = await client().storage.from(BUCKET).remove([path]);
    if (error) throw error;
  }
};
