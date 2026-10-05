import { supabase } from '../../lib/supabaseClient';

const TABLES = [
  'profiles',
  'campaigns',
  'campaign_members',
  'personagens',
  'campaign_sessions',
  'campaign_npcs',
  'campaign_adversaries',
  'campaign_locations',
  'campaign_clues',
  'campaign_lore',
  'campaign_notes',
  'campaign_scenes',
  'campaign_handouts',
  'narrative_maps',
  'map_tokens',
  'session_counters',
  'session_events'
] as const;

const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.');
  return supabase;
};

export const accountDataService = {
  async exportarConta() {
    const db = client();
    const { data: { user }, error: userError } = await db.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sessão autenticada não encontrada.');

    const entries = await Promise.all(TABLES.map(async table => {
      const { data, error } = await db.from(table).select('*');
      if (error) return [table, { error: error.message }] as const;
      return [table, data || []] as const;
    }));

    return {
      formato: 'reinos-oniricos-account-backup-v1',
      exportadoEm: new Date().toISOString(),
      usuario: {
        id: user.id,
        email: user.email,
        criadoEm: user.created_at,
        ultimoLoginEm: user.last_sign_in_at,
        provedor: user.app_metadata?.provider || 'email'
      },
      dados: Object.fromEntries(entries)
    };
  },

  baixarJson(payload: unknown, fileName = 'reinos-oniricos-backup.json') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
};
