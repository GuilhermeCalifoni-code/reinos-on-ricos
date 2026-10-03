export type CaracteristicaPotencia =
  | 'alcance'
  | 'area'
  | 'contador'
  | 'dano'
  | 'deslocamento'
  | 'defesa'
  | 'quantidade'
  | 'resistencia'
  | 'resistencia_materiais'
  | 'tamanho'
  | 'testes';

export const PASSOS_POTENCIA_POR_NIVEL = [
  { nivel: 1, linguagem: 'Perceber', passos: 0, referencia: 'Percepção Onírica' },
  { nivel: 2, linguagem: 'Fortalecer / Enfraquecer', passos: 1, referencia: '1 Passo' },
  { nivel: 3, linguagem: 'Alterar / Transformar', passos: 2, referencia: '2 Passos' },
  { nivel: 4, linguagem: 'Criar', passos: 2, referencia: '2 Passos' },
  { nivel: 5, linguagem: 'Sonhar', passos: 3, referencia: '3 Passos' }
] as const;

export const REGRAS_PASSOS_POTENCIA: Array<{
  id: CaracteristicaPotencia;
  nome: string;
  regra: string;
  observacao?: string;
}> = [
  {
    id: 'alcance',
    nome: 'Alcance',
    regra: 'Base = Muito Próximo. ±1 categoria de Alcance por Passo.',
    observacao: 'Usar Potência para Alcance requer o Domínio Espaço.'
  },
  {
    id: 'area',
    nome: 'Área',
    regra: 'Base = Alvo. ±1 faixa por Passo.'
  },
  {
    id: 'contador',
    nome: 'Contador',
    regra: '±1 no Contador por Passo.'
  },
  {
    id: 'dano',
    nome: 'Dano',
    regra: '±1 categoria de dado por Passo.',
    observacao: 'A progressão comum vai até d12. d20 fica reservado a fenômenos/criaturas oníricas poderosas ou efeitos de Sonhar 5.'
  },
  {
    id: 'deslocamento',
    nome: 'Deslocamento',
    regra: '1–2 Passos: ignora o Teste Reflexo de Correr. 3 Passos: Muito Longe.'
  },
  {
    id: 'defesa',
    nome: 'Defesa',
    regra: '±1 por Passo.'
  },
  {
    id: 'quantidade',
    nome: 'Quantidade',
    regra: '±1 unidade por Passo.'
  },
  {
    id: 'resistencia',
    nome: 'Resistência',
    regra: '±1 categoria por Passo.'
  },
  {
    id: 'resistencia_materiais',
    nome: 'Resistência de materiais',
    regra: '±1 categoria de material por Passo.'
  },
  {
    id: 'tamanho',
    nome: 'Tamanho',
    regra: 'Base = Pequeno. ±1 categoria por Passo.',
    observacao: 'A regra detalhada de Potência e a seção de Objetos e Estruturas usam Pequeno como referência.'
  },
  {
    id: 'testes',
    nome: 'Testes',
    regra: '±1 de bônus por Passo, apenas quando decorrer diretamente da manifestação.'
  }
];

export type MaterialEstrutural = 'fragil' | 'comum' | 'resistente' | 'muito_resistente';
export type TamanhoEstrutural = 'pequeno' | 'medio' | 'grande' | 'imenso';

export const MATERIAIS_ESTRUTURA: Array<{
  id: MaterialEstrutural;
  nome: string;
  exemplos: string;
}> = [
  { id: 'fragil', nome: 'Frágil', exemplos: 'Vidro, cerâmica, plástico leve.' },
  { id: 'comum', nome: 'Comum', exemplos: 'Madeira, plástico rígido, mobiliário cotidiano.' },
  { id: 'resistente', nome: 'Resistente', exemplos: 'Madeira maciça, metal leve, alvenaria.' },
  { id: 'muito_resistente', nome: 'Muito Resistente', exemplos: 'Aço, concreto, pedra espessa e estruturas robustas.' }
];

export const TAMANHOS_OBJETO = [
  { id: 'minusculo', nome: 'Minúsculo', exemplos: 'Moedas, grampo de cabelo, cadeado e anel.' },
  { id: 'pequeno', nome: 'Pequeno', exemplos: 'Ferramentas, armas, garrafas e objetos portáteis.' },
  { id: 'medio', nome: 'Médio', exemplos: 'Portas, mesas, armários e janelas.' },
  { id: 'grande', nome: 'Grande', exemplos: 'Veículos, portões, paredes, colunas e grandes elementos estruturais.' },
  { id: 'imenso', nome: 'Imenso', exemplos: 'Estruturas maciças, pontes ou porções significativas de construções.' }
] as const;

export const RESISTENCIA_ESTRUTURAS: Record<MaterialEstrutural, Record<TamanhoEstrutural, number>> = {
  fragil: { pequeno: 4, medio: 6, grande: 8, imenso: 10 },
  comum: { pequeno: 6, medio: 8, grande: 10, imenso: 12 },
  resistente: { pequeno: 8, medio: 10, grande: 12, imenso: 14 },
  muito_resistente: { pequeno: 10, medio: 12, grande: 14, imenso: 16 }
};

export const resistenciaEstrutura = (material: MaterialEstrutural, tamanho: TamanhoEstrutural): number =>
  RESISTENCIA_ESTRUTURAS[material][tamanho];

export const passosPotenciaDoNivel = (nivel: number): number => {
  const encontrado = PASSOS_POTENCIA_POR_NIVEL.find(item => item.nivel === nivel);
  return encontrado?.passos ?? 0;
};

export const resolverDanoEstrutura = (
  dano: number,
  material: MaterialEstrutural,
  tamanho: TamanhoEstrutural
): { resistencia: number; rompe: boolean } => {
  const resistencia = resistenciaEstrutura(material, tamanho);
  return { resistencia, rompe: dano > resistencia };
};


export const ALCANCE_SONHAR_POR_NIVEL = [
  { nivel: 1, alcance: 'Muito Próximo', requerEspaco: false },
  { nivel: 2, alcance: 'Próximo', requerEspaco: true },
  { nivel: 3, alcance: 'Longe', requerEspaco: true },
  { nivel: 4, alcance: 'Muito Longe', requerEspaco: true },
  { nivel: 5, alcance: 'Além', requerEspaco: true }
] as const;

export const DURACAO_SONHAR_POR_NIVEL = [
  { nivel: 1, duracao: 'Instantâneo' },
  { nivel: 2, duracao: '1 Rodada' },
  { nivel: 3, duracao: '1 Rodada' },
  { nivel: 4, duracao: '1 Cena' },
  { nivel: 5, duracao: '1 Cena' }
] as const;

export const DT_SONHAR_ATIVO: Record<number, number> = {
  1: 10,
  2: 12,
  3: 14,
  4: 16,
  5: 18
};

export const INTENSIDADE_DANO = [
  { dado: 'd4', intensidade: 'Leve', referencia: 'Dor, escoriação ou impacto limitado', exemplos: 'Socos, chutes, objetos pequenos, impactos leves' },
  { dado: 'd6', intensidade: 'Moderado', referencia: 'Ferimento relevante, mas localizado', exemplos: 'Facas, bastões, fraturas e queimaduras localizadas' },
  { dado: 'd8', intensidade: 'Grave', referencia: 'Ferimento com potencial impactante', exemplos: 'Pistolas, revólveres, lâminas grandes, múltiplos estilhaços' },
  { dado: 'd10', intensidade: 'Severo', referencia: 'Ferimento capaz de atravessar, esmagar ou destruir parte do corpo', exemplos: 'Espingardas, fuzis, armas automáticas, esmagamento, grande impacto' },
  { dado: 'd12', intensidade: 'Devastador', referencia: 'Ferimento capaz de destruir ou atingir múltiplas regiões', exemplos: 'Grande explosão, soterramento pesado, esmagamento intenso' },
  { dado: 'd20', intensidade: 'Onírico', referencia: 'Ultrapassa referências físicas comuns', exemplos: 'Fenômenos Oníricos excepcionalmente poderosos; Sonhar 5' }
] as const;

export const AREA_DISTANCIA_DANO = [
  { tipo: 'Corpo a Corpo', area: 'Alvo', distancia: 'Corpo a Corpo', exemplo: 'Luta, garrafa de bar' },
  { tipo: 'Arma Branca ou Artefato Letal', area: 'Alvo ou Muito Próximo', distancia: 'Muito Próximo', exemplo: 'Faca, espada, bastão' },
  { tipo: 'Arremesso improvisado', area: 'Alvo ou Muito Próximo', distancia: 'Próximo', exemplo: 'Garrafa, cadeira' },
  { tipo: 'Arremesso Tático', area: 'Alvo ou Muito Próximo', distancia: 'Próximo', exemplo: 'Lança, granadas' },
  { tipo: 'Efeitos ambientais menores', area: 'Alvo ou Muito Próximo', distancia: 'Próximo', exemplo: 'Queda, queimadura pequena' },
  { tipo: 'Efeitos ambientais moderados', area: 'Muito Próximo até Próximo', distancia: 'Próximo', exemplo: 'Colisões e queimaduras moderadas' },
  { tipo: 'Disparo / Balístico', area: 'Alvo ou Muito Próximo', distancia: 'Longe', exemplo: 'Pistolas, espingardas, metralhadoras' },
  { tipo: 'Efeitos ambientais graves', area: 'Próximo', distancia: 'Longe', exemplo: 'Bombas, colisões, quedas graves, desabamentos, incêndio' }
] as const;

export const VIDA_CURA_FERIMENTO = [
  { nivel: 1, recuperacao: 'Perceber', ferimento: 'Perceber' },
  { nivel: 2, recuperacao: 'Fortalecer recuperação que o organismo ainda seja capaz de reparar', ferimento: 'Enfraquecer recuperação que o organismo ainda seja capaz de reparar' },
  { nivel: 3, recuperacao: '1 PV — regenerar e reparar ativamente tecidos gravemente danificados', ferimento: '1 PV — alterar tecidos, estruturas ou funções biológicas, provocando novos ferimentos' },
  { nivel: 4, recuperacao: '2 PV — criar tecidos, estruturas ou processos biológicos capazes de auxiliar a recuperação', ferimento: '2 PV — criar tecidos, estruturas ou processos biológicos capazes de provocar ferimentos' },
  { nivel: 5, recuperacao: '3 PV — restaurar o organismo além de seus limites naturais', ferimento: '3 PV — ferir ou alterar o organismo além de seus limites naturais' }
] as const;

export const VIDA_ADVERSARIO_POR_NA: Record<number, number> = {
  1: 3,
  2: 5,
  3: 7,
  4: 9,
  5: 12
};

export const DIFICULDADE_ADVERSARIO = [
  { nome: 'Baixa', valor: 12 },
  { nome: 'Padrão', valor: 14 },
  { nome: 'Alta', valor: 16 },
  { nome: 'Monstruosidade', valor: '>16' }
] as const;

export const RESISTENCIA_ADVERSARIO = [
  { nome: 'Baixa', valor: 5 },
  { nome: 'Padrão', valor: 6 },
  { nome: 'Alta', valor: 8 },
  { nome: 'Extrema', valor: 10 }
] as const;

export const PERIGO_ADVERSARIO = [
  { nome: 'Baixo', dado: 'd4' },
  { nome: 'Moderado', dado: 'd6' },
  { nome: 'Grave', dado: 'd8' },
  { nome: 'Severo', dado: 'd10' },
  { nome: 'Devastador', dado: 'd12' },
  { nome: 'Onírico', dado: 'd20' }
] as const;

export const vidaAdversarioPorNA = (nivelAmeaca: number): number =>
  VIDA_ADVERSARIO_POR_NA[Math.max(1, Math.min(5, nivelAmeaca))] ?? 3;

export const dtSonharAtivoPorNivel = (nivelDominio: number): number =>
  DT_SONHAR_ATIVO[Math.max(1, Math.min(5, nivelDominio))] ?? 10;
