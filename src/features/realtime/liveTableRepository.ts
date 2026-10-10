import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { CondicaoCombate, Contador, ConteudoDeCena, MapaNarrativo, TokenMapa } from '../../types/campaign';

export interface LiveSessionState { campaignId: string; sessionId?: string; activeSceneId?: string; activeMapId?: string; contentType: ConteudoDeCena; ruptureGeneral: number; metadata: Record<string, unknown>; updatedBy: string; updatedAt: string; }
export interface CharacterResourceUpdate { id: string; vidaAtual: number; focoAtual: number; ruptura: number; protecaoOniricaAtual: number; updatedAt: string; }
type Row = Record<string, any>;
const client = () => { if (!supabase) throw new Error('Supabase não está configurado.'); return supabase; };
const counter = (row: Row): Contador => ({ id: row.id, campanhaId: row.campaign_id, sessaoId: row.session_id || undefined, cenaId: row.scene_id || undefined, nome: row.nome, descricao: row.descricao || undefined, tipo: row.tipo, valorAtual: row.valor_atual, valorMaximo: row.valor_maximo, direcao: row.direcao, visibilidade: row.visibilidade, gatilho: row.gatilho || undefined, estado: row.estado, criadoEm: row.criado_em, atualizadoEm: row.atualizado_em, criadoPor: row.criado_por || undefined });
const map = (row: Row): MapaNarrativo => ({ id: row.id, campanhaId: row.campaign_id, titulo: row.titulo, imagemUrl: row.imagem_url || undefined, storagePath: row.storage_path || undefined, visibilidade: row.visibilidade, gradeVisivel: row.grade_visivel, gridSize: Number(row.grid_size || 64), criadoEm: row.criado_em, atualizadoEm: row.atualizado_em, criadoPor: row.criado_por || undefined });
const token = (row: Row): TokenMapa => ({ id: row.id, mapaId: row.map_id, campanhaId: row.campaign_id, tipo: row.tipo, nome: row.nome, imagemUrl: row.imagem_url || undefined, characterId: row.character_id || undefined, npcId: row.npc_id || undefined, adversaryId: row.adversary_id || undefined, tokenSize: Number(row.token_size || 1), rangeCells: Number(row.range_cells || 0), areaRadiusCells: Number(row.area_radius_cells || 0), cor: row.cor, x: Number(row.x), y: Number(row.y), oculto: row.oculto, condicoes: (row.condicoes || []) as CondicaoCombate[], criadoEm: row.criado_em, atualizadoEm: row.atualizado_em, criadoPor: row.criado_por || undefined });
const state = (row: Row): LiveSessionState => ({ campaignId: row.campaign_id, sessionId: row.session_id || undefined, activeSceneId: row.active_scene_id || undefined, activeMapId: row.active_map_id || undefined, contentType: row.content_type, ruptureGeneral: row.rupture_general, metadata: row.metadata || {}, updatedBy: row.updated_by, updatedAt: row.updated_at });
const characterResource = (row: Row): CharacterResourceUpdate => ({ id: row.id, vidaAtual: row.vida_atual, focoAtual: row.foco_atual, ruptura: row.ruptura, protecaoOniricaAtual: row.protecao_onirica_atual, updatedAt: row.atualizado_em });
const toCounter = (item: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => ({ campaign_id: item.campanhaId, session_id: item.sessaoId || null, scene_id: item.cenaId || null, nome: item.nome, descricao: item.descricao || null, tipo: item.tipo, valor_atual: item.valorAtual, valor_maximo: item.valorMaximo, direcao: item.direcao, visibilidade: item.visibilidade, gatilho: item.gatilho || null, estado: item.estado });
const toMap = (item: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => ({ campaign_id: item.campanhaId, titulo: item.titulo, imagem_url: item.imagemUrl || null, storage_path: item.storagePath || null, visibilidade: item.visibilidade, grade_visivel: item.gradeVisivel || false, grid_size: item.gridSize ?? 64 });
const toToken = (item: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => ({ map_id: item.mapaId, campaign_id: item.campanhaId, character_id: item.characterId || null, npc_id: item.npcId || null, adversary_id: item.adversaryId || null, tipo: item.tipo, nome: item.nome, imagem_url: item.imagemUrl || null, token_size: item.tokenSize ?? 1, range_cells: item.rangeCells ?? 0, area_radius_cells: item.areaRadiusCells ?? 0, cor: item.cor, x: item.x, y: item.y, oculto: item.oculto, condicoes: item.condicoes ?? [] });

export const liveTableRepository = {
  async load(campaignId: string, includePrivateCounters = false) {
    const api=client();
    const [s,c,m,t,hp]=await Promise.all([
      api.from('live_session_states').select('*').eq('campaign_id',campaignId).maybeSingle(),
      includePrivateCounters ? api.from('session_counters').select('*').eq('campaign_id',campaignId).order('criado_em') : Promise.resolve({data:[],error:null}),
      api.from('narrative_maps').select('*').eq('campaign_id',campaignId).order('criado_em'),
      api.from('map_tokens').select('*').eq('campaign_id',campaignId).order('criado_em'),
      api.from('map_token_resources').select('*').eq('campaign_id',campaignId)
    ]);
    for(const result of [s,c,m,t,hp]) if(result.error) throw result.error;
    const hpByToken=new Map((hp.data||[]).map(row=>[row.token_id,row]));
    return {
      state:s.data ? state(s.data):undefined,
      counters:(c.data||[]).map(counter),
      maps:(m.data||[]).map(map),
      tokens:(t.data||[]).map(row=>{
        const resources=hpByToken.get(row.id);
        return {...token(row),hpCurrent:resources?.hp_current,hpMax:resources?.hp_max};
      })
    };
  },
  async visibleTokens(campaignId: string): Promise<TokenMapa[]> {
    const api = client();
    const [tokensResult, hpResult] = await Promise.all([
      api.from('map_tokens').select('*').eq('campaign_id',campaignId).order('criado_em'),
      api.from('map_token_resources').select('*').eq('campaign_id',campaignId)
    ]);
    if(tokensResult.error) throw tokensResult.error;
    if(hpResult.error) throw hpResult.error;
    const hpByToken=new Map((hpResult.data || []).map(row=>[row.token_id,row]));
    return (tokensResult.data || []).map(row=>{
      const hp=hpByToken.get(row.id);
      return {...token(row),hpCurrent:hp?.hp_current,hpMax:hp?.hp_max};
    });
  },
  async saveState(campaignId: string, userId: string, patch: Partial<LiveSessionState>) { const { data, error } = await client().from('live_session_states').upsert({ campaign_id: campaignId, session_id: patch.sessionId || null, updated_by: userId, content_type: patch.contentType || 'ambientacao', active_scene_id: patch.activeSceneId || null, active_map_id: patch.activeMapId || null, rupture_general: patch.ruptureGeneral || 0, metadata: patch.metadata || {} }, { onConflict: 'campaign_id' }).select().single(); if (error) throw error; return state(data); },
  async addCounter(item: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) { const { data, error } = await client().from('session_counters').insert(toCounter(item)).select().single(); if (error) throw error; return counter(data); },
  async patchCounter(id: string, patch: Partial<Contador>) { const values: Row = {}; if (patch.nome !== undefined) values.nome = patch.nome; if (patch.descricao !== undefined) values.descricao = patch.descricao; if (patch.valorAtual !== undefined) values.valor_atual = patch.valorAtual; if (patch.valorMaximo !== undefined) values.valor_maximo = patch.valorMaximo; if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade; if (patch.estado !== undefined) values.estado = patch.estado; if (patch.gatilho !== undefined) values.gatilho = patch.gatilho; const { data, error } = await client().from('session_counters').update(values).eq('id', id).select().single(); if (error) throw error; return counter(data); },
  async removeCounter(id: string) { const { error } = await client().from('session_counters').delete().eq('id', id); if (error) throw error; },
  async addMap(item: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) { const { data, error } = await client().from('narrative_maps').insert(toMap(item)).select().single(); if (error) throw error; return map(data); },
  async patchMap(id: string, patch: Partial<MapaNarrativo>) { const values: Row = {}; if (patch.titulo !== undefined) values.titulo = patch.titulo; if (patch.imagemUrl !== undefined) values.imagem_url = patch.imagemUrl; if (patch.storagePath !== undefined) values.storage_path = patch.storagePath; if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade; if (patch.gradeVisivel !== undefined) values.grade_visivel = patch.gradeVisivel; if (patch.gridSize !== undefined) values.grid_size = Math.max(24, Math.min(160, patch.gridSize)); const { data, error } = await client().from('narrative_maps').update(values).eq('id', id).select().single(); if (error) throw error; return map(data); },
  async removeMap(id: string) { const { error } = await client().from('narrative_maps').delete().eq('id', id); if (error) throw error; },
  async addToken(item: Omit<TokenMapa,'id'|'criadoEm'|'atualizadoEm'>) {
    const {data,error}=await client().from('map_tokens').insert(toToken(item)).select().single();
    if(error) throw error;
    if(item.hpCurrent!==undefined && item.hpMax!==undefined) {
      const {error:hpError}=await client().from('map_token_resources').upsert({
        token_id:data.id,campaign_id:item.campanhaId,
        hp_current:item.hpCurrent,hp_max:item.hpMax
      });
      if(hpError) {
        await client().from('map_tokens').delete().eq('id',data.id);
        throw hpError;
      }
    }
    return {...token(data),hpCurrent:item.hpCurrent,hpMax:item.hpMax};
  },
  async patchToken(id:string,patch:Partial<TokenMapa>) {
    const values:Row={};
    if(patch.nome!==undefined) values.nome=patch.nome;
    if(patch.imagemUrl!==undefined) values.imagem_url=patch.imagemUrl;
    if(patch.cor!==undefined) values.cor=patch.cor;
    if(patch.x!==undefined) values.x=patch.x;
    if(patch.y!==undefined) values.y=patch.y;
    if(patch.tokenSize!==undefined) values.token_size=Math.max(.5,Math.min(4,patch.tokenSize));
    if(patch.rangeCells!==undefined) values.range_cells=Math.max(0,Math.min(30,patch.rangeCells));
    if(patch.areaRadiusCells!==undefined) values.area_radius_cells=Math.max(0,Math.min(30,Math.round(patch.areaRadiusCells)));
    if(patch.oculto!==undefined) values.oculto=patch.oculto;
    if(patch.condicoes!==undefined) values.condicoes=patch.condicoes;
    const response=Object.keys(values).length
      ? await client().from('map_tokens').update(values).eq('id',id).select().single()
      : await client().from('map_tokens').select('*').eq('id',id).single();
    if(response.error) throw response.error;
    const updated=token(response.data);
    if(patch.hpCurrent!==undefined||patch.hpMax!==undefined) {
      if(patch.hpCurrent===undefined||patch.hpMax===undefined) throw new Error('Informe PV atuais e máximos da cópia.');
      const {error}=await client().from('map_token_resources').upsert({
        token_id:id,campaign_id:updated.campanhaId,
        hp_current:patch.hpCurrent,hp_max:patch.hpMax,
        updated_at:new Date().toISOString()
      });
      if(error) throw error;
      return {...updated,hpCurrent:patch.hpCurrent,hpMax:patch.hpMax};
    }
    return updated;
  },
  async removeToken(id: string) { const { error } = await client().from('map_tokens').delete().eq('id', id); if (error) throw error; },
  async patchOwnToken(id: string, patch: Partial<TokenMapa>) {
    const positioning = patch.x !== undefined || patch.y !== undefined ||
      patch.tokenSize !== undefined || patch.rangeCells !== undefined;
    const settingConditions = patch.condicoes !== undefined;
    // Distinct whitelisted RPCs: no player has blanket UPDATE permission.
    // Both actions are intentionally exclusive so one request cannot smuggle
    // NPC control, hidden-token visibility or private GM fields.
    if (positioning && settingConditions) throw new Error('Atualize movimento e condições separadamente.');
    if (!positioning && !settingConditions) throw new Error('Alteração não autorizada para jogadores.');
    const { data, error } = settingConditions
      ? await client().rpc('set_own_map_token_conditions', {
          p_token_id: id, p_condicoes: patch.condicoes
        })
      : await client().rpc('move_own_map_token', {
          p_token_id: id,
          p_x: patch.x ?? null,
          p_y: patch.y ?? null,
          p_token_size: patch.tokenSize ?? null,
          p_range_cells: patch.rangeCells ?? null
        });
    if (error) throw error;
    return token(data);
  },
  async patchCharacterResources(id: string, patch: Partial<CharacterResourceUpdate>) { const values: Row = {}; if (patch.vidaAtual !== undefined) values.vida_atual = patch.vidaAtual; if (patch.focoAtual !== undefined) values.foco_atual = patch.focoAtual; if (patch.ruptura !== undefined) values.ruptura = patch.ruptura; if (patch.protecaoOniricaAtual !== undefined) values.protecao_onirica_atual = patch.protecaoOniricaAtual; const { data, error } = await client().from('personagens').update(values).eq('id', id).select().single(); if (error) throw error; return characterResource(data); },
  subscribe(campaignId: string, handlers: {
    state: (item: LiveSessionState) => void;
    counter: (event: string, item: Contador) => void;
    map: (event: string, item: MapaNarrativo) => void;
    token: (event: string, item: TokenMapa) => void;
    visibilityChanged: () => void;
    character: (item: CharacterResourceUpdate) => void;
    resource: (item: {tokenId:string;hpCurrent:number;hpMax:number}) => void;
    status: (value: string) => void;
  }, subscribePrivateCounters = false): RealtimeChannel {
    const channel = client().channel(`live-table:${campaignId}`);
    channel.on('postgres_changes', { event:'*', schema:'public', table:'live_session_states', filter:`campaign_id=eq.${campaignId}` },
      payload => handlers.state(state(payload.new)));
    // Players do not even subscribe to the counter stream; RLS additionally
    // enforces that only active masters can SELECT counter rows.
    if (subscribePrivateCounters) {
      channel.on('postgres_changes', { event:'*', schema:'public', table:'session_counters', filter:`campaign_id=eq.${campaignId}` },
        payload => handlers.counter(payload.eventType,counter((payload.new || payload.old) as Row)));
    }
    channel.on('postgres_changes', { event:'*', schema:'public', table:'narrative_maps', filter:`campaign_id=eq.${campaignId}` },
      payload => handlers.map(payload.eventType,map((payload.new || payload.old) as Row)));
    channel.on('postgres_changes', { event:'*', schema:'public', table:'map_tokens', filter:`campaign_id=eq.${campaignId}` },
      payload => handlers.token(payload.eventType,token((payload.new || payload.old) as Row)));
    channel.on('postgres_changes', { event:'*', schema:'public', table:'map_token_visibility_versions',
      filter:`campaign_id=eq.${campaignId}` }, () => handlers.visibilityChanged());
    channel.on('postgres_changes', { event:'*', schema:'public', table:'map_token_resources', filter:`campaign_id=eq.${campaignId}` }, payload => {
      const row=payload.new as Row;
      if(row?.token_id) handlers.resource({tokenId:row.token_id,hpCurrent:row.hp_current,hpMax:row.hp_max});
    });
    channel.on('postgres_changes', { event:'UPDATE', schema:'public', table:'personagens', filter:`campaign_id=eq.${campaignId}` },
      payload => handlers.character(characterResource(payload.new as Row)));
    return channel.subscribe(handlers.status);
  }
};
