// Centralização de Regras, Tabelas e Constantes de Reinos Oníricos RPG
import { DominioNome, DistanciaFaixa } from '../types/character';

export interface ProgressaoNivelInfo {
  nivel: number;
  vidaBase: number;
  bonusDefesa: number;
  protecaoOniricaBase: number;
  pontosDeSonhar: number;
  dominioMaximo: number;
  pontosAtributoAdicionais: number; // cumulativo ou por nível
  descricao: string;
}

export const TABELA_PROGRESSAO: Record<number, ProgressaoNivelInfo> = {
  1: {
    nivel: 1,
    vidaBase: 4,
    bonusDefesa: 0,
    protecaoOniricaBase: 2,
    pontosDeSonhar: 5,
    dominioMaximo: 3,
    pontosAtributoAdicionais: 0,
    descricao: 'Iniciação: Atributos +2, +1, 0, -1. Domínio máx 3.'
  },
  2: {
    nivel: 2,
    vidaBase: 4,
    bonusDefesa: 1,
    protecaoOniricaBase: 2,
    pontosDeSonhar: 7,
    dominioMaximo: 3,
    pontosAtributoAdicionais: 0,
    descricao: 'Defesa +1, 7 Pontos de Sonhar.'
  },
  3: {
    nivel: 3,
    vidaBase: 5,
    bonusDefesa: 1,
    protecaoOniricaBase: 2,
    pontosDeSonhar: 8,
    dominioMaximo: 3,
    pontosAtributoAdicionais: 1,
    descricao: 'Vida sobe para 5, +1 em um Atributo, 8 Pontos de Sonhar.'
  },
  4: {
    nivel: 4,
    vidaBase: 5,
    bonusDefesa: 2,
    protecaoOniricaBase: 2,
    pontosDeSonhar: 9,
    dominioMaximo: 4,
    pontosAtributoAdicionais: 1,
    descricao: 'Defesa +1 adicional (total +2), Domínio máx 4, 9 Pontos de Sonhar.'
  },
  5: {
    nivel: 5,
    vidaBase: 5,
    bonusDefesa: 2,
    protecaoOniricaBase: 2,
    pontosDeSonhar: 10,
    dominioMaximo: 5,
    pontosAtributoAdicionais: 2,
    descricao: '+1 em um Atributo, 10 Pontos de Sonhar. Apenas UM Domínio pode alcançar nível 5.'
  }
};

export const DISTANCIAS_REINOS_ONIRICOS: Record<DistanciaFaixa, {
  nome: string;
  descricao: string;
  exemplos: string;
}> = {
  imediata: {
    nome: 'Imediata',
    descricao: 'Contato corpo a corpo ou toque direto.',
    exemplos: 'Luta corpo a corpo, sussurrar ao ouvido, segurar pelo braço.'
  },
  muito_proxima: {
    nome: 'Muito Próxima',
    descricao: 'Poucos passos dentro do mesmo cômodo.',
    exemplos: 'Mesa ao lado, cruzar uma sala pequena, alcance de um golpe com passo.'
  },
  proxima: {
    nome: 'Próxima',
    descricao: 'Distância de um salão amplo, pátio ou travessia de rua.',
    exemplos: 'Outro lado de uma sala grande, calçada oposta, alcance de arremesso.'
  },
  longe: {
    nome: 'Longe',
    descricao: 'Extensão de um quarteirão, corredor longo ou saguão de metrô.',
    exemplos: 'Final do quarteirão, topo de uma escada monumental, disparo à distância.'
  },
  muito_longe: {
    nome: 'Muito Longe',
    descricao: 'Limite da visão clara urbana ou alcance extremo de tiro.',
    exemplos: 'Topo de um edifício vizinho, fim da avenida, requer aproximação significativa.'
  }
};

export const LINGUAGEM_DOMINIOS = [
  {
    nivel: 1,
    verbo: 'INFLUENCIAR',
    descricao: 'Perceber, direcionar ou provocar pequenas alterações naquilo que já existe.'
  },
  {
    nivel: 2,
    verbo: 'FORTALECER / ENFRAQUECER',
    descricao: 'Aumentar ou reduzir propriedades, características ou efeitos que já existem.'
  },
  {
    nivel: 3,
    verbo: 'ALTERAR / TRANSFORMAR',
    descricao: 'Modificar profundamente a natureza, as propriedades ou o funcionamento de algo que já existe.'
  },
  {
    nivel: 4,
    verbo: 'CRIAR',
    descricao: 'Fazer existir algo que pertence ao Domínio e que poderia existir dentro das regras conhecidas da Realidade, mesmo que não existisse anteriormente.'
  },
  {
    nivel: 5,
    verbo: 'SONHAR',
    descricao: 'Manifestar, dentro do Domínio utilizado, uma possibilidade que não poderia existir ou acontecer segundo as regras conhecidas da Realidade.'
  }
];

export const DESCRICAO_DOMINIOS: Record<DominioNome, {
  nome: string;
  tema: string;
  esfera: string;
  manifestacoesTipicas: string;
}> = {
  consciencia: {
    nome: 'Consciência',
    tema: 'Percepção, pensamentos, emoções, memórias, ilusões e estados mentais.',
    esfera: 'Mente e sentimentos dos seres vivos, percepção sensorial, conexões psíquicas.',
    manifestacoesTipicas: 'Induzir calma ou terror, ocultar presença, ler resquícios de memória, alterar percepção de perigo.'
  },
  espaco: {
    nome: 'Espaço',
    tema: 'Distâncias, geometrias urbanas, passagens, barreiras, dimensões e gravidade local.',
    esfera: 'Arquitetura, limites físicos, corredores intermináveis, dobras espaciais.',
    manifestacoesTipicas: 'Encurtar ou esticar corredores, criar passagens onde há paredes sólidas, abrir portas trancadas pelo Sonhar.'
  },
  fluxo: {
    nome: 'Fluxo',
    tema: 'Tempo, movimento, eletricidade, sinais digitais, luz, som e transmissões.',
    esfera: 'Dinâmica urbana: redes, semáforos, fluxo de trânsito, correntes de energia, aceleração temporal.',
    manifestacoesTipicas: 'Acelerar ou retardar reações, interceptar comunicações, controlar circuitos urbanos, manipular frequências sonoras.'
  },
  substancia: {
    nome: 'Substância',
    tema: 'Matéria, densidade, concreto, asfalto, vidro, metais e objetos inanimados.',
    esfera: 'O tecido material da metrópole, integridade estrutural, solidez e dissolução.',
    manifestacoesTipicas: 'Tornar vidro tão duro quanto titânio, liquefazer asfalto temporariamente, moldar ferro, reparar danos materiais.'
  },
  vida: {
    nome: 'Vida',
    tema: 'Fisiologia, tecidos biológicos, cura, estamina, pragas, mutações e organismos.',
    esfera: 'Corpos humanos e animais, processos metabólicos, cicatrização e deterioração celular.',
    manifestacoesTipicas: 'Estancar hemorragias, fechar ferimentos profundos, neutralizar toxinas, sobrecarregar adrenalina.'
  }
};

export const ESTADOS_RUPTURA: Record<number, {
  nivel: number;
  nome: string;
  descricao: string;
  sintomas: string;
}> = {
  0: {
    nivel: 0,
    nome: 'Ancorado',
    descricao: 'A mente e o corpo estão firmemente alinhados com a Realidade consensual.',
    sintomas: 'Nenhuma interferência sensorial anormal.'
  },
  1: {
    nivel: 1,
    nome: 'Eco Leve',
    descricao: 'O Sonhar murmura nas bordas da visão. Reflexos piscam sutilmente fora de compasso.',
    sintomas: 'Vislumbres fugazes de geometrias anômalas em poças de chuva ou vidraças.'
  },
  2: {
    nivel: 2,
    nome: 'Ressonância',
    descricao: 'A textura da metrópole responde fracamente à presença do personagem.',
    sintomas: 'Luzes fluorescentes zumbem na sua frequência; sombras parecem mais densas.'
  },
  3: {
    nivel: 3,
    nome: 'Fissura',
    descricao: 'A barreira entre Realidade e Sonhar torna-se permeável e instável.',
    sintomas: 'Sussurros indistintos vindos de paredes ou grades de bueiro; sensação de déjà-vu persistente.'
  },
  4: {
    nivel: 4,
    nome: 'Distorção',
    descricao: 'O ambiente imediato começa a reagir às emoções do sonhador sem comando explícito.',
    sintomas: 'Superfícies de concreto adquirem pulsação tênue; relógios mecânicos hesitam.'
  },
  5: {
    nivel: 5,
    nome: 'Fratura Crítica',
    descricao: 'O Sonhar invade ativamente a percepção sensorial. O Mestre pode impor intrusões do Sonhar.',
    sintomas: 'Espelhos mostram versões estranhas do ambiente; o cheiro de ozônio e terra molhada impregna o ar.'
  },
  6: {
    nivel: 6,
    nome: 'Colapso Onírico',
    descricao: 'A ancoragem com a Realidade consensual está em ponto de ruptura total.',
    sintomas: 'A fronteira se desfaz; Pesadelos e entidades do Sonhar percebem a presença com clareza cristalina.'
  }
};
