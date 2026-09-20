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
  atributoPrincipal: AtributoNome, 
  atributos: Atributos, 
  nivel: number
): { defesa: number; base: number; valorAtributo: number; bonusNivel: number } {
  const prog = TABELA_PROGRESSAO[nivel] || TABELA_PROGRESSAO[1];
  const valorAtributo = atributos[atributoPrincipal] ?? 0;
  const base = 8;
  const bonusNivel = prog.bonusDefesa;
  const defesa = base + valorAtributo + bonusNivel;

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
  usarPO: boolean
): ResolucaoDano {
  const danoAposResistencia = Math.max(0, danoRecebido - resistencia);
  let poUtilizada = 0;
  let danoRestante = danoAposResistencia;

  if (usarPO && danoRestante > 0 && poAtual > 0) {
    poUtilizada = Math.min(poAtual, danoRestante);
    danoRestante -= poUtilizada;
  }

  const vidaPerdida = danoRestante;
  const vidaRestante = Math.max(0, vidaAtual - vidaPerdida);
  const poRestante = Math.max(0, poAtual - poUtilizada);
  const absorvidoTotalmente = vidaPerdida === 0;

  let explicacao = `Dano Bruto: ${danoRecebido}. Resistência (${resistencia}) abateu ${Math.min(danoRecebido, resistencia)}.`;
  if (danoAposResistencia > 0) {
    if (poUtilizada > 0) {
      explicacao += ` Proteção Onírica absorveu ${poUtilizada} ponto(s).`;
    }
    if (vidaPerdida > 0) {
      explicacao += ` Restaram ${vidaPerdida} de dano efetivo contra a Vida (Vida: ${vidaAtual} → ${vidaRestante}).`;
    } else {
      explicacao += ` Dano restante foi totalmente contido pela Proteção Onírica.`;
    }
  } else {
    explicacao += ` O golpe não superou a Resistência física do alvo. Vida intacta.`;
  }

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
  const sucesso = totalFinal >= params.dt;

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
    efeitoNarrativo = 'CONVERGÊNCIA: A intenção do Sonhador e a estabilidade da Realidade se harmonizam perfeitamente. A manifestação se concretiza sem distorções anômalas indesejadas e a ancoragem permanece firme.';
    impactoRuptura = 0;
  } else if (sucessoRealidade && !sucessoSonhar) {
    resultado = 'realidade_vence';
    efeitoNarrativo = 'REALIDADE VENCE: A inércia física do mundo consensual resiste ao Sonhar. O efeito pode falhar em sua plenitude onírica ou ser atenuado e racionalizado pelas leis do mundo comum, mas o personagem mantém controle de sua presença.';
    impactoRuptura = 0;
  } else if (!sucessoRealidade && sucessoSonhar) {
    resultado = 'sonhar_vence';
    efeitoNarrativo = 'SONHAR VENCE: O Sonhar invade a Realidade com potência descontrolada! O efeito se manifesta de forma intensa ou desmedida, mas o custo é a fratura da ancoragem com o mundo consensual (+1 de Ruptura).';
    impactoRuptura = 1;
  } else {
    resultado = 'divergencia';
    efeitoNarrativo = 'DIVERGÊNCIA: Colapso da manifestação. Nem a Realidade forneceu solo firme, nem o Sonhar atendeu à vontade do Sonhador. Ocorre uma falha com repercussão imprevisível e tensão acumulada.';
    impactoRuptura = 0;
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
