// Definições de Tipos para Reinos Oníricos RPG

export type AtributoNome = 'corpo' | 'mente' | 'vontade' | 'vinculo';

export interface Atributos {
  corpo: number;
  mente: number;
  vontade: number;
  vinculo: number;
}

export type DominioNome = 'consciencia' | 'espaco' | 'fluxo' | 'substancia' | 'vida';

export interface Dominios {
  consciencia: number;
  espaco: number;
  fluxo: number;
  substancia: number;
  vida: number;
}

export type DistanciaFaixa = 
  | 'imediata'      // Contato corpo a corpo
  | 'muito_proxima' // Poucos passos no mesmo cômodo
  | 'proxima'       // Mesmo ambiente amplo / do outro lado da rua
  | 'longe'         // Alcance de quarteirão / corredor longo
  | 'muito_longe';  // Linha de visão distante / alcance de tiro longo

export interface RecursoItem {
  id: string;
  nome: string;
  descricao?: string;
  quantidade?: number;
}

export interface EquipamentoItem {
  id: string;
  nome: string;
  descricao?: string;
  pesoOuCarga?: string;
  propriedades?: string;
}

export interface VinculoItem {
  id: string;
  nome: string;
  descricao: string;
  intensidade?: number;
}

export interface RupturaLog {
  id: string;
  dataHora: string;
  valorAnterior: number;
  novoValor: number;
  motivo: string;
  origem: 'automatica' | 'manual';
}

export interface Personagem {
  id: string;
  campaignId?: string;
  ownerUserId?: string;
  nome: string;
  jogador?: string;
  conceito: string;
  nivel: number; // 1 a 5
  
  // Atributos base
  atributos: Atributos;
  atributoPrincipal: AtributoNome;
  
  // Atributos derivados & Estado atual
  vidaMaxima: number;
  vidaAtual: number;
  
  resistencia: number; // 6 + Corpo
  defesa: number;      // 8 + Atributo Principal (+ bônus por nível)
  
  protecaoOniricaMaxima: number; // Base 2
  protecaoOniricaAtual: number;
  
  focoMaximo: number;
  focoAtual: number;
  
  ruptura: number; // Trilha de 0 a 6
  historicoRuptura: RupturaLog[];
  
  // Domínios do Sonhar
  dominios: Dominios;
  
  // Vínculos, Recursos e Narrativa
  ancoragem: string;
  vinculos: VinculoItem[];
  recursos: RecursoItem[];
  equipamentos: EquipamentoItem[];
  
  // Percepção Onírica (ferramenta narrativa vinculada aos Domínios)
  percepcaoOniricaNotas?: string;
  anotacoesGerais?: string;
  
  criadoEm: string;
  atualizadoEm: string;
}

// Resolução de Testes
export type ResultadoMundanoTipo = 'sucesso' | 'fracasso' | 'sucesso_critico' | 'desastre';

export interface ResultadoTesteMundano {
  tipo: 'mundano';
  atributo: AtributoNome;
  valorAtributo: number;
  dt: number;
  modificadores: { nome: string; valor: number }[];
  totalModificadores: number;
  dadoBruto: number;
  dadosRolados: number[]; // no caso de vantagem/desvantagem
  modoRolagem: 'normal' | 'vantagem' | 'desvantagem';
  focoUtilizado: boolean;
  totalFinal: number;
  sucesso: boolean;
  explicacao: string;
  timestamp: string;
}

export type ResultadoOniricoTipo = 
  | 'convergencia'     // Ambos passaram a DT
  | 'realidade_vence'  // Apenas Realidade passou a DT
  | 'sonhar_vence'     // Apenas Sonhar passou a DT
  | 'divergencia';     // Nenhum passou a DT

export interface ResultadoTesteOnirico {
  tipo: 'onirico';
  atributo: AtributoNome;
  valorAtributo: number;
  dt: number;
  modificadores: { nome: string; valor: number }[];
  
  dadoRealidade: number;
  totalRealidade: number;
  sucessoRealidade: boolean;
  
  dadoSonhar: number;
  totalSonhar: number;
  sucessoSonhar: boolean;
  
  resultado: ResultadoOniricoTipo;
  efeitoNarrativo: string;
  impactoRuptura: number; // Variação de Ruptura prevista
  explicacao: string;
  timestamp: string;
}
