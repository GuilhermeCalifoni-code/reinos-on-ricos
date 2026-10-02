export type CampanhaTipo = 'campanha' | 'oneshot' | 'playtest';
export type CampanhaStatus = 'em_andamento' | 'planejamento' | 'concluida';
export type VisibilidadeConteudo = 'mestre_privado' | 'compartilhado' | 'revelado_jogadores';
export type SessaoStatus = 'planejamento' | 'pronta' | 'ao_vivo' | 'concluida';
export type ConteudoDeCena = 'ambientacao' | 'imagem' | 'mapa' | 'handout';
export type TipoContador = 'tempo' | 'progresso' | 'problema' | 'conflito' | 'personalizado';
export type DirecaoContador = 'crescente' | 'decrescente';
export type EstadoContador = 'ativo' | 'concluido' | 'pausado';

export interface Campanha {
  id: string;
  ownerId?: string;
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

export interface MembroCampanha {
  campaignId: string;
  userId: string;
  role: 'mestre' | 'jogador' | 'observador';
  characterId?: string;
  nome?: string;
  status: 'ativo' | 'pendente' | 'removido';
  joinedAt: string;
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
  descricao?: string;
  status?: SessaoStatus;
  anotacoesMestre?: string;
  cenaIds?: string[];
  npcIds?: string[];
  localIds?: string[];
  pistaIds?: string[];
  adversarioIds?: string[];
  visibilidade?: VisibilidadeConteudo;
  conteudoDeCena?: ConteudoDeCena;
  criadoPor?: string;
}

export interface NovaSessaoInput {
  titulo: string;
  data?: string;
  descricao?: string;
  status?: SessaoStatus;
  anotacoesMestre?: string;
}

export interface Cena {
  id: string;
  campanhaId: string;
  titulo: string;
  descricao?: string;
  visibilidade: VisibilidadeConteudo;
  tipoDeConteudo: ConteudoDeCena;
  imagemUrl?: string;
}

export interface MapaNarrativo {
  id: string;
  campanhaId: string;
  titulo: string;
  imagemUrl?: string;
  visibilidade: VisibilidadeConteudo;
  gradeVisivel?: boolean;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor?: string;
}

export type TipoTokenMapa = 'personagem' | 'npc' | 'adversario' | 'marcador';

export interface TokenMapa {
  id: string;
  mapaId: string;
  campanhaId: string;
  tipo: TipoTokenMapa;
  nome: string;
  imagemUrl?: string;
  cor: string;
  x: number;
  y: number;
  oculto: boolean;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor?: string;
}

export interface Handout {
  id: string;
  campanhaId: string;
  titulo: string;
  descricao?: string;
  arquivoUrl?: string;
  visibilidade: VisibilidadeConteudo;
}

export interface Contador {
  id: string;
  campanhaId: string;
  sessaoId?: string;
  cenaId?: string;
  nome: string;
  descricao?: string;
  tipo: TipoContador;
  valorAtual: number;
  valorMaximo: number;
  direcao: DirecaoContador;
  visibilidade: VisibilidadeConteudo;
  gatilho?: string;
  estado: EstadoContador;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor?: string;
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
  visibilidade?: VisibilidadeConteudo;
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
  visibilidade?: VisibilidadeConteudo;
}

export interface Local {
  id: string;
  campanhaId: string;
  nome: string;
  tipo: 'urbano' | 'fronteira' | 'onirico';
  descricao: string;
  anomaliaDetectada?: string;
  visibilidade?: VisibilidadeConteudo;
}

export interface Pista {
  id: string;
  campanhaId: string;
  titulo: string;
  tipo: 'documento' | 'objeto' | 'testemunho' | 'anomalia';
  status: 'descoberta' | 'sob_analise' | 'resolvida';
  descricao: string;
  visibilidade?: VisibilidadeConteudo;
}

export interface LoreEntry {
  id: string;
  campanhaId: string;
  titulo: string;
  categoria: 'mundo' | 'faccao' | 'sonhar' | 'regras';
  conteudo: string;
  visibilidade?: VisibilidadeConteudo;
}

export interface Anotacao {
  id: string;
  campanhaId: string;
  titulo: string;
  conteudo: string;
  atualizadaEm: string;
  visibilidade?: VisibilidadeConteudo;
}
