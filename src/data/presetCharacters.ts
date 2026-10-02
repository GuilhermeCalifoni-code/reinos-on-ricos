// Repositório de Personagens Pré-prontos baseados no Capítulo de Exemplo de Jogo do Livro Básico
import { Personagem } from '../types/character';

export const PERSONAGENS_PRE_PRONTOS: Personagem[] = [
  {
    id: 'caio-espaco',
    nome: 'Caio Silveira',
    conceito: 'Lúcido',
    nivel: 1,
    atributos: {
      corpo: 0,
      mente: 2,
      vontade: 1,
      vinculo: -1
    },
    atributoPrincipal: 'mente',
    vidaMaxima: 4,
    vidaAtual: 4,
    resistencia: 6, // 6 + 0
    defesa: 8,      // 8 + Corpo (0)
    protecaoOniricaMaxima: 2,
    protecaoOniricaAtual: 2,
    focoMaximo: 4,
    focoAtual: 4,
    ruptura: 1,
    historicoRuptura: [
      {
        id: 'log-c1',
        dataHora: 'Sessão - Plataforma 0',
        valorAnterior: 0,
        novoValor: 1,
        motivo: 'Sonhar venceu ao tentar mapear a escadaria anômala na estação de metrô.',
        origem: 'automatica'
      }
    ],
    dominios: {
      consciencia: 0,
      espaco: 3,
      fluxo: 0,
      substancia: 0,
      vida: 0
    },
    ancoragem: 'Um mapa dobrado da malha metroviária de 1984 dado por seu pai.',
    vinculos: [
      { id: 'v1', nome: 'Helena', descricao: 'Aliada Desvelada; confia em seu instinto protetor.' },
      { id: 'v2', nome: 'Lívia', descricao: 'Companheira que compreende a solidez da matéria.' }
    ],
    recursos: [
      { id: 'r1', nome: 'Recursos Nível 1', descricao: 'Escasso; vivendo em um pequeno apartamento alugado.' }
    ],
    equipamentos: [
      { id: 'e1', nome: 'Trena laser de medição', descricao: 'Instrumento de precisão arquitetônica.' },
      { id: 'e2', nome: 'Lanterna tática recarregável', descricao: 'Iluminação potente para áreas abandonadas.' }
    ],
    percepcaoOniricaNotas: 'Percebe distorções geométricas e portas que não coincidem com as plantas físicas dos edifícios.',
    anotacoesGerais: 'Arquiteto que começou a enxergar que a cidade se dobra e se esconde por trás das paredes de concreto.',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  },
  {
    id: 'helena-vida',
    nome: 'Helena Vaz',
    conceito: 'Ecoante',
    nivel: 1,
    atributos: {
      corpo: 2,
      mente: 0,
      vontade: 1,
      vinculo: -1
    },
    atributoPrincipal: 'corpo',
    vidaMaxima: 4,
    vidaAtual: 4,
    resistencia: 8, // 6 + 2
    defesa: 10,     // 8 + Corpo (2)
    protecaoOniricaMaxima: 2,
    protecaoOniricaAtual: 2,
    focoMaximo: 4,
    focoAtual: 4,
    ruptura: 0,
    historicoRuptura: [],
    dominios: {
      consciencia: 0,
      espaco: 0,
      fluxo: 0,
      substancia: 0,
      vida: 3
    },
    ancoragem: 'Marina (sua irmã mais nova, cujo desaparecimento a colocou na trilha do Sonhar).',
    vinculos: [
      { id: 'v-h1', nome: 'Marina (Irmã)', descricao: 'Seu farol de lucidez; precisa encontrá-la a qualquer custo.' },
      { id: 'v-h2', nome: 'Tomás', descricao: 'Costuma acalmar suas crises de ansiedade quando o Sonhar pulsa.' }
    ],
    recursos: [
      { id: 'r-h1', nome: 'Recursos Nível 2', descricao: 'Limitado; trabalho como socorrista socorrendo traumas na cidade.' }
    ],
    equipamentos: [
      { id: 'e-h1', nome: 'Kit médico de primeiros socorros', descricao: 'Gaze, torniquete e sedativos leves.' },
      { id: 'e-h2', nome: 'Jaqueta reforçada de couro', descricao: 'Proteção contra intempéries e atrito urbano.' }
    ],
    percepcaoOniricaNotas: 'Sente o batimento cardíaco coletivo de pessoas em ambientes fechados e o ritmo respiratório do Sonhar.',
    anotacoesGerais: 'Ex-paramédica do resgate metropolitano.',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  },
  {
    id: 'tomas-consciencia',
    nome: 'Tomás Brandão',
    conceito: 'Desperto',
    nivel: 1,
    atributos: {
      corpo: -1,
      mente: 1,
      vontade: 0,
      vinculo: 2
    },
    atributoPrincipal: 'vinculo',
    vidaMaxima: 4,
    vidaAtual: 4,
    resistencia: 5, // 6 + (-1)
    defesa: 7,      // 8 + Corpo (-1)
    protecaoOniricaMaxima: 2,
    protecaoOniricaAtual: 2,
    focoMaximo: 4,
    focoAtual: 4,
    ruptura: 0,
    historicoRuptura: [],
    dominios: {
      consciencia: 3,
      espaco: 0,
      fluxo: 0,
      substancia: 0,
      vida: 0
    },
    ancoragem: 'Gravador cassete analógico com as últimas sessões de escuta que gravou.',
    vinculos: [
      { id: 'v-t1', nome: 'Helena', descricao: 'Compartilha um profundo respeito pela dor alheia.' },
      { id: 'v-t2', nome: 'Caio', descricao: 'Admira a capacidade de Caio de não se perder em devaneios teóricos.' }
    ],
    recursos: [
      { id: 'r-t1', nome: 'Recursos Nível 2', descricao: 'Limitado; atua como pesquisador autônomo e terapeuta.' }
    ],
    equipamentos: [
      { id: 'e-t1', nome: 'Gravador de voz digital & microfone de lapela', descricao: 'Registros de sussurros anômalos.' },
      { id: 'e-t2', nome: 'Caderno de notas impermeável com caneta pressurizada', descricao: 'Registros sem falhas.' }
    ],
    percepcaoOniricaNotas: 'Capta resquícios emocionais deixados em objetos e o peso da culpa ou pavor impregnado nos ambientes.',
    anotacoesGerais: 'Investigador de anomalias mentais e fenômenos de delírio coletivo.',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  },
  {
    id: 'livia-substancia',
    nome: 'Lívia Torres',
    conceito: 'Tecelã',
    nivel: 1,
    atributos: {
      corpo: 1,
      mente: 0,
      vontade: 2,
      vinculo: -1
    },
    atributoPrincipal: 'vontade',
    vidaMaxima: 4,
    vidaAtual: 4,
    resistencia: 7, // 6 + 1
    defesa: 9,      // 8 + Corpo (1)
    protecaoOniricaMaxima: 2,
    protecaoOniricaAtual: 2,
    focoMaximo: 4,
    focoAtual: 4,
    ruptura: 0,
    historicoRuptura: [],
    dominios: {
      consciencia: 0,
      espaco: 0,
      fluxo: 0,
      substancia: 3,
      vida: 0
    },
    ancoragem: 'Uma chave mestra de latão maciço herdada de sua avó ferreira.',
    vinculos: [
      { id: 'v-l1', nome: 'Caio', descricao: 'Trabalham bem juntos quando concreto e espaço precisam ceder.' }
    ],
    recursos: [
      { id: 'r-l1', nome: 'Recursos Nível 1', descricao: 'Escasso; sobrevive consertando motores e fechaduras clandestinas.' }
    ],
    equipamentos: [
      { id: 'e-l1', nome: 'Kit profissional de gazuas e chaves de fenda', descricao: 'Abertura rápida e manuseio de mecanismos.' },
      { id: 'e-l2', nome: 'Barra de metal pesada / pé-de-cabra', descricao: 'Alavanca e instrumento de impacto (d6 Lesivo).' }
    ],
    percepcaoOniricaNotas: 'Percebe tensões estruturais em metais, fragilidade em pedras e pontos de fadiga na matéria urbana.',
    anotacoesGerais: 'Serralheira e artesã de peças mecânicas que descobriu que o metal pode se tornar maleável como cera.',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  }
];
