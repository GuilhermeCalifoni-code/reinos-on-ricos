// Tipos para Cena de Tensão, Posto de Comando do Mestre e Condução de Sessão em Reinos Oníricos RPG
import { DistanciaFaixa, DominioNome, AtributoNome } from './character';
export type { DistanciaFaixa, DominioNome, AtributoNome };

export type EstadoCenaTipo = 'tensao' | 'normal' | 'investigacao' | 'exploracao' | 'transicao' | 'encerrada';

export type AntagonistaTipo = 'velado' | 'ameaca' | 'criatura_onirica' | 'pesadelo' | 'humano';

export interface AntagonistaAcao {
  id: string;
  nome: string;
  descricao: string;
  dano?: string;
  alcance?: DistanciaFaixa;
  tipo?: 'ataque' | 'movimento' | 'controle' | 'habilidade';
}

export interface AntagonistaReacao {
  id: string;
  gatilho: string;
  efeito: string;
}

export interface AntagonistaPassiva {
  id: string;
  nome: string;
  descricao: string;
}

export interface AntagonistaCena {
  id: string;
  nome: string;
  tipo: AntagonistaTipo;
  vidaMaxima: number;
  vidaAtual: number;
  resistencia: number;
  defesa: number;
  danoPadrao: string;
  distancia: DistanciaFaixa;
  passivas: AntagonistaPassiva[];
  acoes: AntagonistaAcao[];
  reacoes: AntagonistaReacao[];
  observacoes?: string;
  condicoes: string[];
}

export interface ContadorCena {
  id: string;
  nome: string;
  descricao?: string;
  valorAtual: number;
  valorMaximo: number;
  concluido: boolean;
  consequencia?: string;
}

export interface ObjetivoCena {
  id: string;
  descricao: string;
  estado: 'em_andamento' | 'concluido' | 'falhou';
}

export interface LogEventoCena {
  id: string;
  timestamp: string;
  tipo: 'jogador' | 'mestre' | 'ambiente' | 'contador' | 'sonhar' | 'ataque' | 'distancia' | 'sistema';
  autor: string;
  descricao: string;
  detalhes?: string;
}

export interface TurnoFluxo {
  rodadaAtual: number;
  fase: 'jogador' | 'mestre';
  ultimoJogadorId?: string;
  jogadoresQueAgiramIds: string[];
  mestreAcaoPendente: boolean;
}

export interface CenaCompleta {
  id: string;
  titulo: string;
  descricao: string;
  estado: EstadoCenaTipo;
  elementosFiccao: string[];
  objetivos: ObjetivoCena[];
  contadores: ContadorCena[];
  antagonistas: AntagonistaCena[];
  fluxo: TurnoFluxo;
  log: LogEventoCena[];
}

export interface TesteOniricoResultado {
  atributoNome: AtributoNome;
  atributoValor: number;
  dt: number;
  realidadeDado: number;
  realidadeTotal: number;
  realidadeSucesso: boolean;
  sonhoDado: number;
  sonhoTotal: number;
  sonhoSucesso: boolean;
  interpretacao: string;
  consequenciaSugerida: string;
}
