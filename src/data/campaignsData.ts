import { Campanha, Sessao, NPC, Adversario, Local, Pista, LoreEntry, Anotacao } from '../types/campaign';

// Imagens com atmosfera urbana contemporânea, horror psicológico, asfalto molhado, metrô silencioso, sombras sutis
export const IMAGENS_ATMOSFERICAS_PREDEFINIDAS = [
  {
    id: 'beco-chuva',
    nome: 'Beco Noturno com Asfalto Molhado',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
    descricao: 'Rua urbana à noite, chuva tênue, postes de vapor de sódio e reflexos no asfalto molhado.'
  },
  {
    id: 'metro-vazio',
    nome: 'Estação de Metrô Vazia',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
    descricao: 'Plataforma deserta de concreto, luz fluorescente fria e trilhos que desaparecem na escuridão.'
  },
  {
    id: 'anomalia-urbana',
    nome: 'Prédios e Neblina Tensa',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    descricao: 'Fachadas cinzentas sob bruma pesada, luzes pontuais de escritórios vazios.'
  },
  {
    id: 'corredor-sombra',
    nome: 'Corredor Industrial Silencioso',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    descricao: 'Porta entreaberta com lâmpada piscando em ritmo anômalo.'
  }
];

export const CAMPANHAS_INICIAIS: Campanha[] = [
  {
    id: 'camp-01',
    codigo: 'ONIRICO-01',
    nome: 'Confronto no Beco da Névoa',
    descricao: 'As luzes piscam e o asfalto parece respirar. Uma anomalia na fronteira entre a vigília e o Sonhar.',
    imagemUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
    tipo: 'campanha',
    status: 'em_andamento',
    jogadoresCount: 4,
    sessaoAtual: 6,
    rupturaGeral: 2,
    criadaEm: '2026-08-10T20:00:00.000Z',
    ultimaSessaoData: '18/09/2026',
    personagensIds: ['char-caio-01', 'char-elena-02', 'char-rafael-03']
  },
  {
    id: 'camp-02',
    codigo: 'ONIRICO-02',
    nome: 'O Homem que Atrasa',
    descricao: 'Estação de metrô quase vazia. O relógio da plataforma marca um horário impossível enquanto os passos ecoam.',
    imagemUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
    tipo: 'campanha',
    status: 'em_andamento',
    jogadoresCount: 3,
    sessaoAtual: 2,
    rupturaGeral: 1,
    criadaEm: '2026-09-01T18:30:00.000Z',
    ultimaSessaoData: '15/09/2026',
    personagensIds: ['char-caio-01']
  },
  {
    id: 'camp-03',
    codigo: 'ONIRICO-03',
    nome: 'Playtest #01',
    descricao: 'Uma sombra anômala rasteja onde a luz deveria incidir. Investigação do primeiro relato de ruptura espontânea.',
    imagemUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    tipo: 'playtest',
    status: 'em_andamento',
    jogadoresCount: 4,
    sessaoAtual: 1,
    rupturaGeral: 0,
    criadaEm: '2026-09-12T14:00:00.000Z',
    ultimaSessaoData: '12/09/2026',
    personagensIds: []
  }
];

export const SESSOES_INICIAIS: Sessao[] = [
  {
    id: 'sessao-06',
    campanhaId: 'camp-01',
    numero: 6,
    titulo: 'O que existe atrás da porta?',
    data: '18/09/2026',
    jogadoresCount: 4,
    resumo: 'O grupo cruzou o limiar do armazém da ferrovia. As paredes latejavam e o ar tinha gosto de ozônio.',
    concluida: false
  },
  {
    id: 'sessao-05',
    campanhaId: 'camp-01',
    numero: 5,
    titulo: 'O metrô não deveria estar funcionando.',
    data: '11/09/2026',
    jogadoresCount: 4,
    resumo: 'Descida pelo túnel desativado da linha vermelha. Encontro com a Sombra do Engenheiro.',
    concluida: true
  },
  {
    id: 'sessao-04',
    campanhaId: 'camp-01',
    numero: 4,
    titulo: 'Páginas que Sangram Luz',
    data: '04/09/2026',
    jogadoresCount: 4,
    resumo: 'Análise do diário do arquiteto desaparecido na biblioteca municipal.',
    concluida: true
  }
];

export const NPCS_INICIAIS: NPC[] = [
  {
    id: 'npc-01',
    campanhaId: 'camp-01',
    nome: 'Dr. Valente',
    papel: 'Médico Legista Velado',
    conceito: 'Observador metódico que percebe mortes com causas que desafiam a física.',
    descricao: 'Homem de meia-idade, jaleco surrado, óculos de aro fino. Recusa-se a assinar laudos que mencionam anomalias.',
    atitude: 'aliado',
    localizacao: 'Necrotério Central de São Paulo'
  },
  {
    id: 'npc-02',
    campanhaId: 'camp-01',
    nome: 'A Garota da Linha 4',
    papel: 'Manifestação Onírica',
    conceito: 'Aparece sempre no mesmo vagão às 23:42.',
    descricao: 'Não fala com voz humana; os passageiros comuns olham através dela.',
    atitude: 'neutro',
    localizacao: 'Plataforma Estação Paulista'
  }
];

export const ADVERSARIOS_INICIAIS: Adversario[] = [
  {
    id: 'adv-01',
    campanhaId: 'camp-01',
    nome: 'Sombra do Arquiteto',
    tipo: 'pesadelo',
    nivel: 2,
    vida: 8,
    vidaMaxima: 8,
    defesa: 11,
    resistencia: 8,
    ataquePrincipal: 'Eco de Concreto (1d8 de Dano de Tensão)',
    descricao: 'Uma silhueta feita de poeira cinzenta e ângulos impossíveis.'
  },
  {
    id: 'adv-02',
    campanhaId: 'camp-01',
    nome: 'Vigilante Corrompido',
    tipo: 'humano',
    nivel: 1,
    vida: 5,
    vidaMaxima: 5,
    defesa: 10,
    resistencia: 7,
    ataquePrincipal: 'Cassetete Pesado (1d6 de Dano)',
    descricao: 'Segurança tomado pelo delírio do Sonhar, age como marionete.'
  }
];

export const LOCAIS_INICIAIS: Local[] = [
  {
    id: 'loc-01',
    campanhaId: 'camp-01',
    nome: 'Beco dos Sete Relógios',
    tipo: 'fronteira',
    descricao: 'Uma travessa sem saída onde os relógios de pulso atrasam exatamente 17 minutos ao entrar.',
    anomaliaDetectada: 'Flutuação do Domínio do Fluxo detectada (Nível 2).'
  },
  {
    id: 'loc-02',
    campanhaId: 'camp-01',
    nome: 'Galpão 14 — Vila Leopoldina',
    tipo: 'onirico',
    descricao: 'Um armazém abandonado onde a gravidade parece puxar ligeiramente na direção do teto.',
    anomaliaDetectada: 'Distorção do Domínio do Espaço.'
  }
];

export const PISTAS_INICIAIS: Pista[] = [
  {
    id: 'pis-01',
    campanhaId: 'camp-01',
    titulo: 'Gravação da Câmera 07 (03:14 AM)',
    tipo: 'documento',
    status: 'descoberta',
    descricao: 'O vídeo mostra um indivíduo entrando no beco, mas nunca saindo. Os últimos 4 segundos exibem interferência geométrica.'
  },
  {
    id: 'pis-02',
    campanhaId: 'camp-01',
    titulo: 'Chave de Latão sem Dentes',
    tipo: 'objeto',
    status: 'sob_analise',
    descricao: 'Encontrada no chão molhado. Quando segurada perto do ouvido, emite o sussurro de uma orquestra desafinada.'
  }
];

export const LORE_INICIAIS: LoreEntry[] = [
  {
    id: 'lore-01',
    campanhaId: 'camp-01',
    titulo: 'O Princípio da Vigília Frágil',
    categoria: 'mundo',
    conteudo: 'A realidade consensual em que a maioria vive é sustentada pela crença coletiva. Quando um Desvelado impõe o Sonhar, a trama do tecido mundano range.'
  },
  {
    id: 'lore-02',
    campanhaId: 'camp-01',
    titulo: 'Sintomas da Ruptura Urbana',
    categoria: 'sonhar',
    conteudo: 'No nível 1 a 2, lâmpadas queimam e animais desviam o olhar. No nível 5 a 6, o espaço dobra e a própria memória dos presentes pode ser reescrita.'
  }
];

export const ANOTACOES_INICIAIS: Anotacao[] = [
  {
    id: 'not-01',
    campanhaId: 'camp-01',
    titulo: 'Plano para a Próxima Rodada',
    conteudo: 'Os jogadores descobriram a chave. Precisam decidir se investigam o necrotério com o Dr. Valente ou se enfrentam o galpão 14 antes da meia-noite.',
    atualizadaEm: '18/09/2026 23:10'
  }
];
