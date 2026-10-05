import { supabase } from '../../lib/supabaseClient';

const BUCKET = 'profile-avatars';

const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.');
  return supabase;
};

const validateAvatar = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione uma imagem PNG, JPG, WEBP ou GIF.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem de perfil deve ter no máximo 5 MB.');
  }
};

export const profileAssetService = {
  async uploadAvatar(file: File) {
    validateAvatar(file);
    const { data: { user }, error: userError } = await client().auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sessão autenticada não encontrada.');

    const path = `${user.id}/avatar`;
    const { error } = await client().storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600'
      });

    if (error) throw error;

    const { data } = client().storage.from(BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  },

  async removeAvatar() {
    const { data: { user }, error: userError } = await client().auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sessão autenticada não encontrada.');

    const path = `${user.id}/avatar`;
    const { error } = await client().storage.from(BUCKET).remove([path]);
    if (error) throw error;
  }
};
