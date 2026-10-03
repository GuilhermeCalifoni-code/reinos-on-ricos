import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Personagem } from '../types/character';

// Variáveis de ambiente configuradas no Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Testar conexão
export async function testarConexaoSupabase(): Promise<{ ok: boolean; mensagem: string }> {
  if (!supabase) {
    return {
      ok: false,
      mensagem: 'Supabase não configurado no .env (defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).'
    };
  }

  try {
    const { error } = await supabase.from('campaigns').select('id').limit(1);
    if (error) {
      // Se a tabela ainda não foi criada no banco
      if (error.code === '42P01') {
        return {
          ok: false,
          mensagem: 'Conectado ao Supabase, mas o schema atual ainda não foi aplicado. Execute as migrations 001–011.'
        };
      }
      return { ok: false, mensagem: `Erro do Supabase: ${error.message}` };
    }
    return { ok: true, mensagem: 'Conectado ao banco Supabase com sucesso!' };
  } catch (err: any) {
    return { ok: false, mensagem: err?.message || 'Falha ao conectar com o Supabase.' };
  }
}

// Sincronizar Personagem com Supabase
export async function syncPersonagemComSupabase(
  personagem: Personagem,
  mesaCodigo: string = 'ONIRICO-01'
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('personagens').upsert({
      id: personagem.id,
      mesa_codigo: mesaCodigo,
      nome: personagem.nome,
      jogador: personagem.jogador,
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
      condicoes: personagem.condicoes || { oculto: false, impedido: false, vulneravel: false },
      dominios: personagem.dominios,
      ancoragem: personagem.ancoragem,
      vinculos: personagem.vinculos,
      equipamentos: personagem.equipamentos,
      recursos: personagem.recursos,
      percepcao_onirica_notas: personagem.percepcaoOniricaNotas,
      anotacoes_gerais: personagem.anotacoesGerais,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      console.warn('Erro ao salvar personagem no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Falha de rede Supabase:', err);
    return false;
  }
}

// Carregar Personagens da Mesa no Supabase
export async function carregarPersonagensDoSupabase(
  mesaCodigo: string = 'ONIRICO-01'
): Promise<Personagem[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('personagens')
      .select('*')
      .eq('mesa_codigo', mesaCodigo);

    if (error || !data) {
      console.warn('Erro ao carregar personagens do Supabase:', error?.message);
      return null;
    }

    // Mapear colunas do banco de volta para a interface Personagem
    return data.map((row: any): Personagem => ({
      id: row.id,
      nome: row.nome,
      jogador: row.jogador,
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
      condicoes: row.condicoes || { oculto: false, impedido: false, vulneravel: false },
      dominios: row.dominios,
      ancoragem: row.ancoragem || '',
      vinculos: row.vinculos || [],
      equipamentos: row.equipamentos || [],
      recursos: row.recursos || [],
      percepcaoOniricaNotas: row.percepcao_onirica_notas || '',
      anotacoesGerais: row.anotacoes_gerais || '',
      criadoEm: row.criado_em || new Date().toISOString(),
      atualizadoEm: row.atualizado_em || new Date().toISOString()
    }));
  } catch (err) {
    console.error('Falha ao carregar do Supabase:', err);
    return null;
  }
}

// Excluir Personagem do Supabase
export async function excluirPersonagemDoSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('personagens').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Registrar Rolagem no Feed da Mesa
export async function registrarRolagemSupabase(params: {
  mesaCodigo: string;
  autorNome: string;
  autorRole: 'mestre' | 'jogador';
  tipoTeste: string;
  dadosRolados: any;
  resultado: string;
  sucesso?: boolean;
  deltaRuptura?: number;
  detalhes?: string;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('rolagens').insert({
      mesa_codigo: params.mesaCodigo,
      autor_nome: params.autorNome,
      autor_role: params.autorRole,
      tipo_teste: params.tipoTeste,
      dados_rolados: params.dadosRolados,
      resultado: params.resultado,
      sucesso: params.sucesso ?? null,
      delta_ruptura: params.deltaRuptura ?? 0,
      detalhes: params.detalhes ?? ''
    });
    return !error;
  } catch {
    return false;
  }
}
