// Rules Engine: Cálculos Objetivos e Validações Matemáticas de Reinos Oníricos RPG
import { 
  AtributoNome, 
  Atributos, 
  Dominios, 
  DominioNome, 
  ResultadoTesteMundano, 
  ResultadoTesteOnirico,
  ResultadoOniricoTipo
} from '../types/character';
import { TABELA_PROGRESSAO } from './rulesData';

export function calcularResistencia(corpo: number): number {
  return 6 + corpo;
}

export function calcularDefesa(
  _atributoPrincipal: AtributoNome,
  atributos: Atributos,
  _nivel: number
): { defesa: number; base: number; valorAtributo: number; bonusNivel: number } {
  // Regra atual: Defesa = 8 + Corpo. O Atributo Principal não altera a Defesa.
  const valorAtributo = atributos.corpo ?? 0;
  const base = 8;
  const bonusNivel = 0;
  const defesa = base + valorAtributo;

  return {
    defesa,
    base,
    valorAtributo,
    bonusNivel
  };
}

export function calcularVidaMaxima(nivel: number): number {
  const prog = TABELA_PROGRESSAO[nivel] || TABELA_PROGRESSAO[1];
  return prog.vidaBase;
}

export function calcularProtecaoOniricaMaxima(nivel: number): number {
  const prog = TABELA_PROGRESSAO[nivel] || TABELA_PROGRESSAO[1];
  return prog.protecaoOniricaBase;
}

export interface ValidacaoDominiosResult {
  valida: boolean;
  pontosTotais: number;
  pontosUsados: number;
  pontosDisponiveis: number;
  limitePorDominio: number;
  erros: string[];
}

export function validarDistribuicaoDominios(dominios: Dominios, nivel: number): ValidacaoDominiosResult {
  const prog = TABELA_PROGRESSAO[nivel] || TABELA_PROGRESSAO[1];
  const pontosTotais = prog.pontosDeSonhar;
  const limitePorDominio = prog.dominioMaximo;
  
  const listaValores = [
    { nome: 'Consciência', valor: dominios.consciencia },
    { nome: 'Espaço', valor: dominios.espaco },
    { nome: 'Fluxo', valor: dominios.fluxo },
    { nome: 'Substância', valor: dominios.substancia },
    { nome: 'Vida', valor: dominios.vida }
  ];

  const pontosUsados = listaValores.reduce((acc, d) => acc + (d.valor || 0), 0);
  const pontosDisponiveis = pontosTotais - pontosUsados;
  const erros: string[] = [];

  // 1. Limite individual por domínio
  listaValores.forEach(d => {
    if (d.valor < 0) {
      erros.push(`${d.nome} não pode ter valor negativo.`);
    }
    if (d.valor > limitePorDominio) {
      erros.push(`${d.nome} (${d.valor}) ultrapassa o limite máximo permitido para Nível ${nivel} (${limitePorDominio}).`);
    }
  });

  // 2. Regra especial do Nível 5
  if (nivel === 5) {
    const qtdNivel5 = listaValores.filter(d => d.valor === 5).length;
    if (qtdNivel5 > 1) {
      erros.push('No Nível 5 de personagem, apenas UM Domínio pode alcançar Nível 5. Todos os demais devem ser no máximo Nível 4.');
    }
  }

  // 3. Pontos excedentes
  if (pontosUsados > pontosTotais) {
    erros.push(`Distribuição excede os Pontos de Sonhar disponíveis (${pontosUsados}/${pontosTotais}).`);
  }

  return {
    valida: erros.length === 0,
    pontosTotais,
    pontosUsados,
    pontosDisponiveis,
    limitePorDominio,
    erros
  };
}

export function validarDominiosCombinados(
  principal: { nome: DominioNome; nivel: number },
  secundarios: { nome: DominioNome; nivel: number }[]
): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  
  if (principal.nivel <= 0) {
    erros.push('O Domínio Principal precisa possuir ao menos Nível 1.');
  }

  secundarios.forEach(sec => {
    if (sec.nivel <= 0) return;
    if (principal.nivel <= sec.nivel) {
      erros.push(
        `O Domínio Principal (${principal.nome.toUpperCase()} Nível ${principal.nivel}) deve ser estritamente superior ao Secundário (${sec.nome.toUpperCase()} Nível ${sec.nivel}) por pelo menos 1 ponto.`
      );
    }
  });

  return {
    valido: erros.length === 0,
    erros
  };
}

// Resolução de Dano segundo a mecânica de Reinos Oníricos
export interface ResolucaoDano {
  danoRecebido: number;
  resistencia: number;
  danoAposResistencia: number;
  poUtilizada: number;
  vidaPerdida: number;
  vidaRestante: number;
  poRestante: number;
  absorvidoTotalmente: boolean;
  explicacao: string;
}

export function processarDano(
  danoRecebido: number,
  resistencia: number,
  vidaAtual: number,
  poAtual: number,
  usarPO: boolean,
  usarDanoMassivo: boolean = true
): ResolucaoDano {
  // Reinos Oníricos não subtrai Resistência do dano para descobrir perda de PV.
  // O dano é comparado à R e convertido em 1, 2 ou, pela regra opcional, 3 PV.
  const danoAposResistencia = Math.max(0, danoRecebido - resistencia);
  let vidaPerdidaBase = danoRecebido > resistencia ? 2 : 1;
  if (usarDanoMassivo && danoRecebido > resistencia * 2) vidaPerdidaBase = 3;

  const poUtilizada = usarPO && poAtual > 0 && vidaPerdidaBase > 0 ? 1 : 0;
  const vidaPerdida = Math.max(0, vidaPerdidaBase - poUtilizada);
  const vidaRestante = Math.max(0, vidaAtual - vidaPerdida);
  const poRestante = Math.max(0, poAtual - poUtilizada);
  const absorvidoTotalmente = vidaPerdida === 0;

  const faixa = danoRecebido > resistencia * 2 && usarDanoMassivo
    ? 'Dano Massivo: 3 PV'
    : danoRecebido > resistencia
      ? 'Dano > R: 2 PV'
      : 'Dano ≤ R: 1 PV';
  const explicacao = `Dano ${danoRecebido} vs R ${resistencia}. ${faixa}.${poUtilizada ? ' 1 PO reduz a perda em 1 PV.' : ''} Vida: ${vidaAtual} → ${vidaRestante}.`;

  return {
    danoRecebido,
    resistencia,
    danoAposResistencia,
    poUtilizada,
    vidaPerdida,
    vidaRestante,
    poRestante,
    absorvidoTotalmente,
    explicacao
  };
}

// Rolador de Teste Mundano
export function executarTesteMundano(params: {
  atributo: AtributoNome;
  valorAtributo: number;
  dt: number;
  modificadores: { nome: string; valor: number }[];
  modoRolagem: 'normal' | 'vantagem' | 'desvantagem';
  usarFoco: boolean;
}): ResultadoTesteMundano {
  const rolarD20 = () => Math.floor(Math.random() * 20) + 1;
  const dados: number[] = [];

  let dadoEscolhido = 0;
  if (params.modoRolagem === 'vantagem') {
    dados.push(rolarD20(), rolarD20());
    dadoEscolhido = Math.max(...dados);
  } else if (params.modoRolagem === 'desvantagem') {
    dados.push(rolarD20(), rolarD20());
    dadoEscolhido = Math.min(...dados);
  } else {
    dados.push(rolarD20());
    dadoEscolhido = dados[0];
  }

  const totalModificadores = params.modificadores.reduce((acc, m) => acc + m.valor, 0);
  const bonusFoco = params.usarFoco ? 2 : 0;
  const totalFinal = dadoEscolhido + params.valorAtributo + totalModificadores + bonusFoco;
  const sucesso = dadoEscolhido === 20 || totalFinal >= params.dt;

  const partesExplicacao: string[] = [
    `Dado: [${dadoEscolhido}]${dados.length > 1 ? ` (de ${dados.join(', ')})` : ''}`,
    `Atributo (${params.atributo}): ${params.valorAtributo >= 0 ? '+' : ''}${params.valorAtributo}`
  ];

  if (totalModificadores !== 0) {
    partesExplicacao.push(`Modificadores: ${totalModificadores >= 0 ? '+' : ''}${totalModificadores}`);
  }
  if (params.usarFoco) {
    partesExplicacao.push(`Foco: +2`);
  }

  partesExplicacao.push(`Total: ${totalFinal} vs DT ${params.dt}`);

  return {
    tipo: 'mundano',
    atributo: params.atributo,
    valorAtributo: params.valorAtributo,
    dt: params.dt,
    modificadores: params.modificadores,
    totalModificadores: totalModificadores + bonusFoco,
    dadoBruto: dadoEscolhido,
    dadosRolados: dados,
    modoRolagem: params.modoRolagem,
    focoUtilizado: params.usarFoco,
    totalFinal,
    sucesso,
    explicacao: partesExplicacao.join(' | '),
    timestamp: new Date().toLocaleTimeString('pt-BR')
  };
}

// Rolador de Teste Onírico
export function executarTesteOnirico(params: {
  atributo: AtributoNome;
  valorAtributo: number;
  dt: number;
  modificadores: { nome: string; valor: number }[];
}): ResultadoTesteOnirico {
  const rolarD20 = () => Math.floor(Math.random() * 20) + 1;
  const dadoRealidade = rolarD20();
  const dadoSonhar = rolarD20();

  const totalMod = params.modificadores.reduce((acc, m) => acc + m.valor, 0);
  const totalRealidade = dadoRealidade + params.valorAtributo + totalMod;
  const totalSonhar = dadoSonhar + params.valorAtributo + totalMod;

  const sucessoRealidade = totalRealidade >= params.dt;
  const sucessoSonhar = totalSonhar >= params.dt;

  let resultado: ResultadoOniricoTipo;
  let efeitoNarrativo = '';
  let impactoRuptura = 0;

  if (sucessoRealidade && sucessoSonhar) {
    resultado = 'convergencia';
    efeitoNarrativo = 'CONVERGÊNCIA: a manifestação acontece e é crítica. A trilha de Ruptura é reduzida em 1.';
    impactoRuptura = -1;
  } else if (sucessoRealidade && !sucessoSonhar) {
    resultado = 'realidade_vence';
    efeitoNarrativo = 'REALIDADE VENCE: a manifestação não acontece e a Ruptura não se altera.';
    impactoRuptura = 0;
  } else if (!sucessoRealidade && sucessoSonhar) {
    resultado = 'sonhar_vence';
    efeitoNarrativo = 'SONHAR VENCE: a manifestação acontece e a trilha de Ruptura aumenta em 1.';
    impactoRuptura = 1;
  } else {
    resultado = 'divergencia';
    efeitoNarrativo = 'DIVERGÊNCIA: a manifestação não acontece e a trilha de Ruptura aumenta em 2.';
    impactoRuptura = 2;
  }

  const explicacao = `Realidade: [${dadoRealidade}] + Atrib (${params.valorAtributo}) = ${totalRealidade} (${sucessoRealidade ? 'PASSOU' : 'FALHOU'}). Sonhar: [${dadoSonhar}] + Atrib (${params.valorAtributo}) = ${totalSonhar} (${sucessoSonhar ? 'PASSOU' : 'FALHOU'}).`;

  return {
    tipo: 'onirico',
    atributo: params.atributo,
    valorAtributo: params.valorAtributo,
    dt: params.dt,
    modificadores: params.modificadores,
    dadoRealidade,
    totalRealidade,
    sucessoRealidade,
    dadoSonhar,
    totalSonhar,
    sucessoSonhar,
    resultado,
    efeitoNarrativo,
    impactoRuptura,
    explicacao,
    timestamp: new Date().toLocaleTimeString('pt-BR')
  };
}
