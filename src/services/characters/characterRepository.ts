import { supabase } from '../../lib/supabaseClient';
import { Personagem } from '../../types/character';

const client = () => { if (!supabase) throw new Error('Supabase não está configurado.'); return supabase; };

const mapCharacter = (row: any): Personagem => ({
  id: row.id,
  campaignId: row.campaign_id || undefined,
  ownerUserId: row.owner_user_id || undefined,
  nome: row.nome,
  jogador: row.jogador || 'Jogador',
  conceito: row.conceito,
  nivel: row.nivel,
  atributos: row.atributos,
  atributoPrincipal: row.atributo_principal,
  resistencia: row.resistencia,
  defesa: row.defesa,
  vidaAtual: row.vida_atual,
  vidaMaxima: row.vida_maxima,
  focoAtual: row.foco_atual,
  focoMaximo: row.foco_maximo,
  protecaoOniricaAtual: row.protecao_onirica_atual,
  protecaoOniricaMaxima: row.protecao_onirica_maxima,
  ruptura: row.ruptura,
  historicoRuptura: row.historico_ruptura || [],
  dominios: row.dominios,
  ancoragem: row.ancoragem || '',
  vinculos: row.vinculos || [],
  equipamentos: row.equipamentos || [],
  recursos: row.recursos || [],
  percepcaoOniricaNotas: row.percepcao_onirica_notas || '',
  anotacoesGerais: row.anotacoes_gerais || '',
  criadoEm: row.criado_em || new Date().toISOString(),
  atualizadoEm: row.atualizado_em || new Date().toISOString()
});

export const characterRepository = {
  async listar(campaignId: string) {
    const { data, error } = await client().from('personagens').select('*').eq('campaign_id', campaignId).order('nome');
    if (error) throw error;
    return (data || []).map(mapCharacter);
  },

  async salvar(personagem: Personagem) {
    if (!personagem.campaignId) throw new Error('Uma ficha remota precisa estar vinculada a uma campanha.');
    const { data, error } = await client().from('personagens').upsert({
      id: personagem.id,
      campaign_id: personagem.campaignId,
      owner_user_id: personagem.ownerUserId || null,
      nome: personagem.nome,
      jogador: personagem.jogador || 'Jogador',
      conceito: personagem.conceito,
      nivel: personagem.nivel,
      atributos: personagem.atributos,
      atributo_principal: personagem.atributoPrincipal,
      resistencia: personagem.resistencia,
      defesa: personagem.defesa,
      vida_atual: personagem.vidaAtual,
      vida_maxima: personagem.vidaMaxima,
      foco_atual: personagem.focoAtual,
      foco_maximo: personagem.focoMaximo,
      protecao_onirica_atual: personagem.protecaoOniricaAtual,
      protecao_onirica_maxima: personagem.protecaoOniricaMaxima,
      ruptura: personagem.ruptura,
      historico_ruptura: personagem.historicoRuptura,
      dominios: personagem.dominios,
      ancoragem: personagem.ancoragem,
      vinculos: personagem.vinculos,
      equipamentos: personagem.equipamentos,
      recursos: personagem.recursos,
      percepcao_onirica_notas: personagem.percepcaoOniricaNotas || '',
      anotacoes_gerais: personagem.anotacoesGerais || ''
    }, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return mapCharacter(data);
  },

  async excluir(id: string) {
    const { error } = await client().from('personagens').delete().eq('id', id);
    if (error) throw error;
  }
};
