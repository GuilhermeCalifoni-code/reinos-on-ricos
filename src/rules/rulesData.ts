// Centralização de Regras, Tabelas e Constantes de Reinos Oníricos RPG
import { DominioNome, DistanciaFaixa } from '../types/character';

export interface ProgressaoNivelInfo {
  nivel: number;
  vidaBase: number;
  bonusDefesa: number;
  protecaoOniricaBase: number;
  focoBase: number;
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
    focoBase: 4,
    pontosDeSonhar: 5,
    dominioMaximo: 3,
    pontosAtributoAdicionais: 0,
    descricao: 'Iniciação: Atributos +2, +1, 0, -1. Domínio máx 3.'
  },
  2: {
    nivel: 2,
    vidaBase: 4,
    bonusDefesa: 0,
    protecaoOniricaBase: 2,
    focoBase: 5,
    pontosDeSonhar: 7,
    dominioMaximo: 3,
    pontosAtributoAdicionais: 0,
    descricao: '+1 PF, 7 Pontos de Sonhar. Domínio máximo 3.'
  },
  3: {
    nivel: 3,
    vidaBase: 5,
    bonusDefesa: 0,
    protecaoOniricaBase: 2,
    focoBase: 5,
    pontosDeSonhar: 8,
    dominioMaximo: 4,
    pontosAtributoAdicionais: 1,
    descricao: '+1 PV, +1 em um Atributo, 8 Pontos de Sonhar. Domínio máximo 4.'
  },
  4: {
    nivel: 4,
    vidaBase: 5,
    bonusDefesa: 0,
    protecaoOniricaBase: 2,
    focoBase: 6,
    pontosDeSonhar: 9,
    dominioMaximo: 4,
    pontosAtributoAdicionais: 1,
    descricao: '+1 PF, 9 Pontos de Sonhar. Domínio máximo 4.'
  },
  5: {
    nivel: 5,
    vidaBase: 5,
    bonusDefesa: 0,
    protecaoOniricaBase: 2,
    focoBase: 6,
    pontosDeSonhar: 10,
    dominioMaximo: 5,
    pontosAtributoAdicionais: 2,
    descricao: '+1 em um Atributo, +1 Ponto de Sonhar, Domínio máximo 5; apenas UM Domínio pode alcançar nível 5.'
  }
};

export const DISTANCIAS_REINOS_ONIRICOS: Record<DistanciaFaixa, {
  nome: string;
  descricao: string;
  exemplos: string;
}> = {
  imediata: {
    nome: 'Corpo a Corpo',
    descricao: 'Contato direto até aproximadamente 1,5 m.',
    exemplos: 'Luta, agarrar, tocar ou usar uma arma corpo a corpo.'
  },
  muito_proxima: {
    nome: 'Muito Próximo',
    descricao: 'Até aproximadamente 3 m.',
    exemplos: 'Poucos passos, outro lado de uma sala pequena.'
  },
  proxima: {
    nome: 'Próximo',
    descricao: 'De aproximadamente 3 m a 9 m.',
    exemplos: 'Sala ampla, pátio, outro lado da rua.'
  },
  longe: {
    nome: 'Longe',
    descricao: 'De aproximadamente 9 m a 15 m.',
    exemplos: 'Corredor longo, saguão, disparo balístico.'
  },
  muito_longe: {
    nome: 'Muito Longe',
    descricao: 'De aproximadamente 15 m a 30 m.',
    exemplos: 'Grande salão, trecho de avenida, alcance extremo dentro de uma Cena.'
  },
  alem: {
    nome: 'Além',
    descricao: 'Acima de 30 m até cerca de 60 m.',
    exemplos: 'Outro prédio, trecho distante de uma avenida ou alcance excepcional.'
  }
};

export const LINGUAGEM_DOMINIOS = [
  {
    nivel: 1,
    verbo: 'PERCEBER',
    descricao: 'Sentir e compreender o aspecto do Domínio. Percepção Onírica não é onisciência e não exige Teste Onírico para perceber ou interpretar algo presente.'
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
    tema: 'Percepção, emoção, memória, pensamento e identidade.',
    esfera: 'Experiências mentais, interpretação, lembranças, emoções e estados da consciência.',
    manifestacoesTipicas: 'Intensificar uma emoção, transformar uma memória, criar uma experiência sensorial ou Sonhar estados mentais impossíveis.'
  },
  espaco: {
    nome: 'Espaço',
    tema: 'Posição, distância e relações espaciais.',
    esfera: 'Movimento, configuração espacial, caminhos, passagens e relações entre lugares.',
    manifestacoesTipicas: 'Ampliar ou reduzir distâncias, trocar posições, criar passagens ou Sonhar geometrias impossíveis.'
  },
  fluxo: {
    nome: 'Fluxo',
    tema: 'Ritmo, duração, processos e causalidade.',
    esfera: 'Velocidade e ordem de processos, duração de acontecimentos e relações de causa e efeito.',
    manifestacoesTipicas: 'Acelerar ou desacelerar processos, alterar sua duração ou ordem, iniciar sequências possíveis ou Sonhar causalidade impossível.'
  },
  substancia: {
    nome: 'Substância',
    tema: 'Matéria e propriedades físicas.',
    esfera: 'Materiais, objetos, dureza, peso, temperatura e estrutura física.',
    manifestacoesTipicas: 'Fortalecer uma propriedade, transformar matéria, criar um objeto possível ou Sonhar matéria de propriedades impossíveis.'
  },
  vida: {
    nome: 'Vida',
    tema: 'Organismos e processos vitais.',
    esfera: 'Tecidos, órgãos, crescimento, recuperação e estruturas biológicas.',
    manifestacoesTipicas: 'Fortalecer recuperação, transformar tecidos, criar estruturas biológicas possíveis ou Sonhar vida além dos limites naturais.'
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
