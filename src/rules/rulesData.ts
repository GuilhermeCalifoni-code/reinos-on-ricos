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
    descricao: 'Até aproximadamente 1,5 m.',
    exemplos: 'Luta, toque direto, agarrar alguém ou usar uma arma corpo a corpo.'
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
    descricao: 'De aproximadamente 15 m a 30 m.',
    exemplos: 'Outro lado de uma avenida larga, grande salão ou extremo de uma área aberta.'
  },
  alem: {
    nome: 'Além',
    descricao: 'Mais de 30 m até cerca de 60 m.',
    exemplos: 'Trecho longo de avenida, outro prédio próximo ou limite de uma grande área aberta.'
  }
};

export const DT_SONHAR_POR_NIVEL: Record<number, number> = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18
};

export const TABELA_VIDA_FERIMENTO = [
  { nivel: 1, recuperacao: 'Perceber', ferimento: 'Perceber' },
  { nivel: 2, recuperacao: 'Fortalecer a recuperação que o organismo ainda é capaz de realizar.', ferimento: 'Enfraquecer a recuperação que o organismo ainda é capaz de realizar.' },
  { nivel: 3, recuperacao: 'Recupere 1 PV ao regenerar/reparar ativamente tecidos gravemente danificados.', ferimento: 'Cause 1 PV ao alterar diretamente tecidos, estruturas ou funções biológicas.' },
  { nivel: 4, recuperacao: 'Recupere 2 PV ao criar tecidos, estruturas ou processos biológicos de recuperação.', ferimento: 'Cause 2 PV ao criar tecidos, estruturas ou processos biológicos capazes de ferir.' },
  { nivel: 5, recuperacao: 'Recupere 3 PV ao restaurar o organismo além de seus limites naturais.', ferimento: 'Cause 3 PV ao ferir ou alterar o organismo além de seus limites naturais.' }
] as const;

export const TABELA_INTENSIDADE_DANO = [
  { dado: 'd4', intensidade: 'Leve', exemplos: 'Socos, chutes, objetos pequenos e impactos leves.' },
  { dado: 'd6', intensidade: 'Moderado', exemplos: 'Facas, bastões, fraturas e queimaduras.' },
  { dado: 'd8', intensidade: 'Grave', exemplos: 'Pistolas, revólveres, lâminas grandes e múltiplos estilhaços.' },
  { dado: 'd10', intensidade: 'Severo', exemplos: 'Espingardas, fuzis, armas automáticas, esmagamento e grande impacto.' },
  { dado: 'd12', intensidade: 'Devastador', exemplos: 'Grande explosão, soterramento pesado e esmagamento intenso.' },
  { dado: 'd20', intensidade: 'Onírico', exemplos: 'Fenômenos e criaturas Oníricas excepcionalmente poderosos; Sonhar 5.' }
] as const;

export const TABELA_AREA_DISTANCIA_DANO = [
  { tipo: 'Corpo a Corpo', area: 'Alvo', distancia: 'Corpo a Corpo', exemplo: 'Luta, garrafa de bar.' },
  { tipo: 'Arma Branca ou Artefato Letal', area: 'Alvo ou Muito Próximo', distancia: 'Muito Próximo', exemplo: 'Faca, espada, bastão.' },
  { tipo: 'Arremesso improvisado', area: 'Alvo ou Muito Próximo', distancia: 'Próximo', exemplo: 'Garrafa, cadeira.' },
  { tipo: 'Arremesso Tático', area: 'Alvo ou Muito Próximo', distancia: 'Próximo', exemplo: 'Lança, granada.' },
  { tipo: 'Efeitos ambientais menores', area: 'Alvo ou Muito Próximo', distancia: 'Próximo', exemplo: 'Queda, queimadura pequena.' },
  { tipo: 'Efeitos ambientais moderados', area: 'Muito Próximo até Próximo', distancia: 'Próximo', exemplo: 'Colisão moderada, queimadura moderada.' },
  { tipo: 'Disparo balístico', area: 'Alvo ou Muito Próximo', distancia: 'Longe', exemplo: 'Pistolas, espingardas, metralhadoras.' },
  { tipo: 'Efeitos ambientais graves', area: 'Próximo', distancia: 'Longe', exemplo: 'Bombas, colisões, quedas graves, desabamentos e incêndio.' }
] as const;

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
