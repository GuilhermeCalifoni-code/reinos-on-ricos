export type CaracteristicaPotencia =
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
    regra: '1 Passo: Longe; 2 Passos: Muito Longe; 3 Passos: Além.'
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
    regra: 'Base = Médio. ±1 categoria por Passo.',
    observacao: 'O Livro Básico atualizado usa Médio como referência de Potência para Tamanho.'
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
