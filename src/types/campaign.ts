export type CampanhaTipo = 'campanha' | 'oneshot' | 'playtest';
export type CampanhaStatus = 'em_andamento' | 'planejamento' | 'concluida';

export interface Campanha {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  imagemUrl: string;
  tipo: CampanhaTipo;
  status: CampanhaStatus;
  jogadoresCount: number;
  sessaoAtual: number;
  rupturaGeral: number; // 0 a 6
  criadaEm: string;
  ultimaSessaoData: string;
  personagensIds: string[];
}

export interface Sessao {
  id: string;
  campanhaId: string;
  numero: number;
  titulo: string;
  data: string;
  jogadoresCount: number;
  resumo?: string;
  concluida: boolean;
}

export interface NPC {
  id: string;
  campanhaId: string;
  nome: string;
  papel: string;
  conceito: string;
  descricao: string;
  atitude: 'aliado' | 'neutro' | 'hostil' | 'desconhecido';
  localizacao: string;
}

export interface Adversario {
  id: string;
  campanhaId: string;
  nome: string;
  tipo: 'humano' | 'pesadelo' | 'aberracao' | 'sombra';
  nivel: number;
  vida: number;
  vidaMaxima: number;
  defesa: number;
  resistencia: number;
  ataquePrincipal: string;
  descricao: string;
}

export interface Local {
  id: string;
  campanhaId: string;
  nome: string;
  tipo: 'urbano' | 'fronteira' | 'onirico';
  descricao: string;
  anomaliaDetectada?: string;
}

export interface Pista {
  id: string;
  campanhaId: string;
  titulo: string;
  tipo: 'documento' | 'objeto' | 'testemunho' | 'anomalia';
  status: 'descoberta' | 'sob_analise' | 'resolvida';
  descricao: string;
}

export interface LoreEntry {
  id: string;
  campanhaId: string;
  titulo: string;
  categoria: 'mundo' | 'faccao' | 'sonhar' | 'regras';
  conteudo: string;
}

export interface Anotacao {
  id: string;
  campanhaId: string;
  titulo: string;
  conteudo: string;
  atualizadaEm: string;
}
