import { supabase } from '../../lib/supabaseClient';

const BUCKET = 'reinos-oniricos';
const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  return supabase;
};

const sanitize = (name: string) => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');

export const campaignAssetService = {
  isRemoteCampaignId(campaignId: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId);
  },

  async uploadMap(campaignId: string, file: File) {
    const extName = sanitize(file.name || 'mapa');
    const path = `campaigns/${campaignId}/maps/${Date.now()}-${extName}`;
    const { error } = await client().storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
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
