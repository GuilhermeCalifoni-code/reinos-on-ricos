import { Campanha, CampanhaTipo, MembroCampanha } from '../../types/campaign';
import { supabase } from '../../lib/supabaseClient';

const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  return supabase;
};

const requireAuthenticatedUser = async () => {
  const { data: { user }, error } = await client().auth.getUser();
  if (error || !user) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }
  return user;
};

const friendlyCampaignError = (error: any) => {
  const message = String(error?.message || '');

  const limit = /PROJECT_LIMIT_REACHED:(\d+)/.exec(message);
  if (limit) {
    return new Error(`Você atingiu o limite de ${limit[1]} projetos de mesa do seu nível.`);
  }

  if (/invalid invite code/i.test(message)) {
    return new Error('Código de convite inválido ou expirado.');
  }

  if (
    error?.status === 401 ||
    error?.status === 403 ||
    /jwt|token|auth|session/i.test(message)
  ) {
    return new Error('Sua sessão expirou. Entre novamente para continuar.');
  }

  return error instanceof Error ? error : new Error(message || 'Não foi possível concluir a ação.');
};
const mapCampaign = (row: any): Campanha => ({ id: row.id, ownerId: row.owner_id, codigo: row.codigo_convite, nome: row.nome, descricao: row.descricao || '', imagemUrl: row.imagem_url || '', tipo: row.tipo, status: row.status, jogadoresCount: row.jogadores_count || 0, sessaoAtual: row.sessao_atual || 1, rupturaGeral: row.ruptura_geral || 0, criadaEm: row.criado_em, ultimaSessaoData: row.atualizado_em || row.criado_em, personagensIds: [] });
const mapMember = (row: any, nome?: string): MembroCampanha => ({ campaignId: row.campaign_id, userId: row.user_id, role: row.role, characterId: row.character_id || undefined, nome, status: row.status, joinedAt: row.joined_at });

export const campaignRepository = {
  async listar() { const { data, error } = await client().from('campaigns').select('*').order('atualizado_em', { ascending: false }); if (error) throw error; return (data || []).map(mapCampaign); },
  async membros() {
    const { data, error } = await client().from('campaign_members').select('*');
    if (error) throw error;
    const rows = data || [];
    const ids = Array.from(new Set(rows.map((row: any) => row.user_id)));
    let nomes = new Map<string, string>();
    if (ids.length) {
      const { data: profiles, error: profilesError } = await client().from('profiles').select('user_id,nome').in('user_id', ids);
      if (!profilesError) nomes = new Map((profiles || []).map((profile: any) => [profile.user_id, profile.nome]));
    }
    return rows.map((row: any) => mapMember(row, nomes.get(row.user_id)));
  },
  async criar(input: { nome: string; descricao: string; imagemUrl: string; tipo: CampanhaTipo }) {
    await requireAuthenticatedUser();

    const { data, error } = await client().rpc('create_campaign', {
      p_nome: input.nome,
      p_descricao: input.descricao,
      p_imagem_url: input.imagemUrl,
      p_tipo: input.tipo
    });

    if (error) throw friendlyCampaignError(error);

    const { data: row, error: readError } = await client()
      .from('campaigns')
      .select('*')
      .eq('id', data)
      .single();

    if (readError) throw friendlyCampaignError(readError);
    return mapCampaign(row);
  },

  async entrarComCodigo(codigo: string) {
    await requireAuthenticatedUser();

    const normalized = codigo.trim().toUpperCase();
    if (!/^REINO-[A-F0-9]{12}$/.test(normalized)) {
      throw new Error('Código de convite inválido. Confira o código enviado pelo Mestre.');
    }

    const { data, error } = await client().rpc('join_campaign_by_code', {
      p_codigo: normalized
    });

    if (error) throw friendlyCampaignError(error);
    return data as string;
  },
  async regenerarCodigo(campaignId: string) { const { data, error } = await client().rpc('regenerate_campaign_invite', { p_campaign_id: campaignId }); if (error) throw error; return data as string; },
  async vincularPersonagem(campaignId: string, characterId: string) { const { error } = await client().rpc('link_own_character_to_membership', { p_campaign_id: campaignId, p_character_id: characterId }); if (error) throw error; },
  async atualizarImagem(campaignId: string, imagemUrl: string) {
    const { data, error } = await client().from('campaigns').update({ imagem_url: imagemUrl }).eq('id', campaignId).select('*').single();
    if (error) throw error;
    return mapCampaign(data);
  },

  async buscarPorLegacyLocalId(localId: string) {
    const { data, error } = await client()
      .from('campaigns')
      .select('*')
      .eq('legacy_local_id', localId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapCampaign(data) : null;
  },

  async marcarLegacyLocalId(campaignId: string, localId: string) {
    const { data, error } = await client()
      .from('campaigns')
      .update({ legacy_local_id: localId })
      .eq('id', campaignId)
      .select('*')
      .single();
    if (error) throw error;
    return mapCampaign(data);
  },

  async atualizar(campaignId: string, patch: Partial<Pick<Campanha, 'status' | 'sessaoAtual' | 'rupturaGeral' | 'descricao' | 'nome'>>) {
    const values: Record<string, unknown> = {};
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.sessaoAtual !== undefined) values.sessao_atual = patch.sessaoAtual;
    if (patch.rupturaGeral !== undefined) values.ruptura_geral = patch.rupturaGeral;
    if (patch.descricao !== undefined) values.descricao = patch.descricao;
    if (patch.nome !== undefined) values.nome = patch.nome;
    const { data, error } = await client().from('campaigns').update(values).eq('id', campaignId).select('*').single();
    if (error) throw error;
    return mapCampaign(data);
  },
  async remover(campaignId: string) { const { error } = await client().from('campaigns').delete().eq('id', campaignId); if (error) throw error; },
  async atualizarMembro(campaignId: string, userId: string, patch: { role?: MembroCampanha['role']; status?: MembroCampanha['status']; characterId?: string | null }) {
    const values: Record<string, unknown> = {};
    if (patch.role !== undefined) values.role = patch.role;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.characterId !== undefined) values.character_id = patch.characterId;
    const { error } = await client().from('campaign_members').update(values).eq('campaign_id', campaignId).eq('user_id', userId);
    if (error) throw error;
  }
};
