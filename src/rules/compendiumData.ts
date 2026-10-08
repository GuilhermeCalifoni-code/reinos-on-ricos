export type CompendiumCategory =
  | 'regras'
  | 'sonhar'
  | 'desvelados'
  | 'combate'
  | 'mestre'
  | 'adversarios'
  | 'mundo'
  | 'referencia';

export type CompendiumArt = 'dice' | 'dream' | 'vortex' | 'rupture' | 'none';

export interface CompendiumEntry {
  id: string;
  category: CompendiumCategory;
  eyebrow: string;
  title: string;
  summary: string;
  answer: string;
  steps?: string[];
  details?: string[];
  keywords: string[];
  art?: CompendiumArt;
  featured?: boolean;
}

export const COMPENDIUM_CATEGORIES: Array<{
  id: CompendiumCategory;
  label: string;
  description: string;
}> = [
  { id: 'regras', label: 'Regras', description: 'Testes, dificuldades, condições, descanso e contadores.' },
  { id: 'sonhar', label: 'Sonhar', description: 'Domínios, Teste Onírico, Potência, Ruptura e Delírio.' },
  { id: 'desvelados', label: 'Desvelados', description: 'Criação, recursos, progressão, Ancoragem e ficha.' },
  { id: 'combate', label: 'Combate & Tensão', description: 'Ações, Movimento, ataques, ajuda e neutralização.' },
  { id: 'mestre', label: 'Mestre', description: 'Arbitragem, investigação, pressão e condução de histórias.' },
  { id: 'adversarios', label: 'Adversários', description: 'Fichas, Natureza, Pesadelos e construção de ameaças.' },
  { id: 'mundo', label: 'Mundo', description: 'Velados, Desvelados, DCR, Dissonantes e fenômenos Oníricos.' },
  { id: 'referencia', label: 'Referência Rápida', description: 'Resumo para consulta durante a mesa.' }
];

export const COMPENDIUM_ENTRIES: CompendiumEntry[] = [
  {
    id: 'teste-mundano',
    category: 'regras',
    eyebrow: 'Testes',
    title: 'Teste Mundano',
    summary: '1d20 + Atributo contra uma DT.',
    answer: 'Role 1d20 + o Atributo apropriado. Se o resultado for igual ou maior que a DT, a ação é bem-sucedida. Só role quando houver incerteza relevante e uma consequência interessante para a falha.',
    steps: [
      'Defina a intenção e o Atributo apropriado.',
      'O Mestre determina a DT conforme a dificuldade da situação.',
      'Role 1d20 + Atributo.',
      'Compare o resultado à DT e aplique a consequência.'
    ],
    details: [
      '20 natural é sucesso automático.',
      'Se um Teste Mundano causar dano e obtiver 20 natural, o dano é crítico.',
      'DTs de referência: 8 Trivial, 10 Fácil, 12 Comum, 14 Desafiador, 16 Difícil, 18 Muito difícil, 20 Extraordinário e acima de 20 Onírico.'
    ],
    keywords: ['teste mundano', 'teste', 'd20', 'dt', 'dificuldade', '20 natural', 'atributo', 'rolagem'],
    art: 'dice',
    featured: true
  },
  {
    id: 'teste-reflexo',
    category: 'regras',
    eyebrow: 'Testes',
    title: 'Teste Reflexo',
    summary: 'Uma reação rápida a um evento disparador.',
    answer: 'Teste Reflexo é sempre um Teste Mundano solicitado como reação a um perigo, efeito ambiental ou habilidade. O Mestre escolhe Atributo e DT conforme a ficção.',
    details: [
      'Foco pode ser usado normalmente.',
      'Condições podem impedir a reação quando a causa da Condição tornar aquela resposta impossível.'
    ],
    keywords: ['reflexo', 'reação', 'gatilho', 'evento', 'perigo', 'armadilha'],
    art: 'dice'
  },
  {
    id: 'vantagem-desvantagem',
    category: 'regras',
    eyebrow: 'Regras avançadas',
    title: 'Vantagem e Desvantagem',
    summary: 'Role 2d20 e use o maior ou o menor resultado.',
    answer: 'Com Vantagem, role 2d20 e use o maior. Com Desvantagem, role 2d20 e use o menor. Fontes múltiplas não acumulam e Vantagem + Desvantagem se anulam.',
    details: [
      'A narrativa determina quando a circunstância realmente favorece ou prejudica a ação.',
      'Testes Oníricos nunca recebem Vantagem ou Desvantagem.'
    ],
    keywords: ['vantagem', 'desvantagem', '2d20', 'maior resultado', 'menor resultado'],
    art: 'dice'
  },
  {
    id: 'condicoes',
    category: 'regras',
    eyebrow: 'Estados',
    title: 'Condições',
    summary: 'Estados temporários ligados à causa narrativa.',
    answer: 'Condições alteram o que um Personagem ou Adversário consegue fazer. A causa da Condição define quais ações são afetadas, quais continuam possíveis e como ela pode ser superada.',
    details: [
      'Oculto: ações que dependam de localizar ou perceber diretamente o alvo podem sofrer Desvantagem; se perceber for impossível, a ação não pode ser realizada.',
      'Impedido: se a limitação torna uma ação impossível, ela não pode ser feita; se apenas a dificulta significativamente, o Teste Mundano sofre Desvantagem.',
      'Vulnerável: ações do próprio afetado podem sofrer Desvantagem quando a vulnerabilidade interferir diretamente; ações contra ele podem receber Vantagem quando explorarem essa vulnerabilidade.',
      'Se uma Condição dificultar significativamente a manifestação, a DT Onírica aumenta em +2. Se impedir condição indispensável para manifestar, ela é impossível daquela maneira.',
      'Aumentos de DT por Condições não se acumulam; considere apenas a mais relevante.'
    ],
    keywords: ['condição', 'condições', 'oculto', 'impedido', 'vulnerável', 'cego', 'agarrado', 'caído', 'desorientado'],
    art: 'rupture',
    featured: true
  },
  {
    id: 'descanso',
    category: 'regras',
    eyebrow: 'Recuperação',
    title: 'Descanso',
    summary: '8 horas e 2 Movimentos de Descanso.',
    answer: 'Um Descanso representa em média 8 horas de sono. Cada Jogador recebe 2 Movimentos de Descanso e pode ganhar 1 Movimento adicional ao passar tempo com sua Ancoragem.',
    details: [
      'Cicatrização: recupere todos os PV.',
      'Remover Condição: remova uma Condição apropriada.',
      'Restaurar a Proteção: recupere a Proteção Onírica.',
      'Restaurar Ruptura: a trilha volta a 0.',
      'Recuperar Foco: recupere todos os PF gastos.',
      'Projeto Pessoal: investigue, aprenda, construa ou crie algo ligado aos seus objetivos.'
    ],
    keywords: ['descanso', 'dormir', 'recuperar', 'cura', 'foco', 'ruptura', 'proteção onírica', 'ancoragem', '8 horas'],
    art: 'dream'
  },
  {
    id: 'contadores',
    category: 'regras',
    eyebrow: 'Pressão',
    title: 'Contadores',
    summary: 'Tempo, progresso ou pressão que muda a Cena.',
    answer: 'Contadores registram tempo, progresso ou pressão. O Mestre define valor inicial e quais acontecimentos alteram a contagem.',
    details: [
      'Passagem do Tempo: crescente ou decrescente até um evento relevante.',
      'Resolução de Problemas: acompanha etapas necessárias para solucionar uma situação.',
      'Conflitos: pode representar uma disputa de progresso entre lados diferentes.',
      'Um Contador não existe apenas para punir falhas; ele mostra que a situação está mudando.'
    ],
    keywords: ['contador', 'contadores', 'tempo', 'progresso', 'pressão', 'relógio', 'investigação'],
    art: 'vortex'
  },
  {
    id: 'teste-onirico',
    category: 'sonhar',
    eyebrow: 'Sonhar',
    title: 'Teste Onírico',
    summary: '2d20 + Atributo: Realidade e Sonhar contra a mesma DT.',
    answer: 'Role 2d20 + o mesmo Atributo apropriado. Um dado representa Realidade e o outro Sonhar. Compare cada dado separadamente à DT, normalmente 13.',
    details: [
      'Convergência: ambos passam; a manifestação acontece, é crítico e reduz 1 Ruptura.',
      'Realidade vence: apenas Realidade passa; a manifestação não acontece e Ruptura não muda.',
      'Sonhar vence: apenas Sonhar passa; a manifestação acontece e aumenta 1 Ruptura.',
      'Divergência: ambos falham; a manifestação não acontece e aumenta 2 Ruptura.',
      'Não existem margens de sucesso entre os dois dados.',
      'Foco pode ser usado antes do Teste e o bônus se aplica aos dois resultados.'
    ],
    keywords: ['teste onírico', 'sonhar', 'realidade', 'convergência', 'divergência', 'dt 13', 'ruptura', '2d20'],
    art: 'dream',
    featured: true
  },
  {
    id: 'ruptura',
    category: 'sonhar',
    eyebrow: 'Instabilidade',
    title: 'Ruptura',
    summary: 'A tensão acumulada entre Realidade e Sonhar.',
    answer: 'A trilha de Ruptura vai de 0 a 6. Ao chegar a 6, resolva primeiro a manifestação que levou ao limite; depois o Mestre estabelece um Efeito de Ruptura coerente e a trilha retorna a 0.',
    details: [
      'Construa o efeito a partir de Origem, Domínio e Pressão.',
      'O efeito deve criar Dificuldade, Obstáculo ou Perigo.',
      'Não deve desfazer a manifestação que acabou de acontecer nem torná-la mais vantajosa.',
      'A consequência pode ser revelada depois na mesma Cena, mas não deve ser adiada indefinidamente.'
    ],
    keywords: ['ruptura', '6 ruptura', 'efeito de ruptura', 'origem', 'domínio', 'pressão'],
    art: 'vortex',
    featured: true
  },
  {
    id: 'delirio',
    category: 'sonhar',
    eyebrow: 'Velados',
    title: 'Delírio',
    summary: 'O contato de um Velado com o impossível.',
    answer: 'Quando um Velado testemunha uma manifestação Onírica perceptível, pode ocorrer Delírio. Quando ocorre, todos os Desvelados presentes recebem +1 Ruptura; o número de testemunhas não multiplica esse aumento.',
    details: [
      'Coincidente/Leve: sutil, breve ou plausivelmente confundido com algo possível; não gera Delírio.',
      'Moderado: perceptível e difícil de explicar; gera Delírio.',
      'Intenso: contradiz abertamente as regras conhecidas da Realidade; gera Delírio.',
      'Dispositivos tecnológicos, por si só, não provocam o Delírio intenso da experiência direta.'
    ],
    keywords: ['delírio', 'velado', 'esquecimento', 'moderado', 'intenso', 'testemunha', 'ruptura'],
    art: 'rupture'
  },
  {
    id: 'dominios',
    category: 'sonhar',
    eyebrow: 'Linguagem Onírica',
    title: 'Domínios do Sonhar',
    summary: 'Consciência, Espaço, Fluxo, Substância e Vida.',
    answer: 'O Domínio define qual aspecto da Realidade está sendo manipulado. Conhecer um Domínio concede acesso à Percepção Onírica daquele aspecto e os níveis maiores aprofundam o que pode ser feito.',
    details: [
      'Consciência: percepção, emoção, memória, pensamento e identidade.',
      'Espaço: posição, distância e relações espaciais.',
      'Fluxo: ritmo, duração, processos e causalidade.',
      'Substância: matéria e propriedades físicas.',
      'Vida: organismos e processos vitais.',
      'Níveis: 1 Perceber; 2 Fortalecer/Enfraquecer; 3 Alterar/Transformar; 4 Criar; 5 Sonhar.'
    ],
    keywords: ['domínio', 'domínios', 'consciência', 'espaço', 'fluxo', 'substância', 'vida', 'perceber', 'criar'],
    art: 'dream'
  },
  {
    id: 'guia-sonhar',
    category: 'sonhar',
    eyebrow: 'Arbitragem',
    title: 'Guia do Sonhar',
    summary: 'Da intenção ao Teste Onírico.',
    answer: 'O Sonhar não possui lista fechada de poderes. Comece pela intenção, identifique o aspecto alterado, use o menor nível capaz de produzir a mudança e então resolva alcance, alvos, duração, complexidade, Potência, Atributo e Teste.',
    steps: [
      'Intenção: diga o que muda na Realidade.',
      'Domínio: identifique o aspecto diretamente alterado.',
      'Nível: use o menor nível capaz de realizar a mudança.',
      'Defina alcance, alvos/área e duração.',
      'Se necessário, determine complexidade e Potência.',
      'Escolha o Atributo conforme a abordagem narrada.',
      'Faça o Teste Onírico e aplique manifestação, Ruptura e consequências.'
    ],
    keywords: ['guia do sonhar', 'manifestação', 'intenção', 'domínio', 'nível', 'alcance', 'duração', 'potência'],
    art: 'dream'
  },
  {
    id: 'potencia',
    category: 'sonhar',
    eyebrow: 'Intensidade',
    title: 'Potência do Sonhar',
    summary: 'O nível diz o que é possível; a Potência diz quanto.',
    answer: 'Quando uma manifestação altera uma característica com expressão mecânica, use Passos de Potência. Todos os Passos disponíveis são aplicados a uma única característica da manifestação.',
    details: [
      'Nível 2: 1 Passo.',
      'Nível 3: 2 Passos.',
      'Nível 4: 2 Passos.',
      'Nível 5: 3 Passos.',
      'Os Passos não podem ser divididos entre Dano, Defesa, Área, Alcance ou outras características diferentes.'
    ],
    keywords: ['potência', 'passos', 'dano', 'alcance', 'área', 'defesa', 'resistência', 'tamanho'],
    art: 'vortex'
  },
  {
    id: 'criacao-desvelado',
    category: 'desvelados',
    eyebrow: 'Criação',
    title: 'Criar um Desvelado',
    summary: 'Conceito, Atributos, recursos, Domínios e Ancoragem.',
    answer: 'No nível 1, escolha um Conceito, distribua +2, +1, 0 e -1 entre Corpo, Mente, Vontade e Vínculo, escolha um Atributo Principal e complete os recursos e Domínios.',
    details: [
      'Conceitos: Lúcido, Tecelão, Desperto ou Ecoante.',
      'PV 4; Foco 4; Proteção Onírica 2.',
      'Resistência = 6 + Corpo; Defesa = 8 + Corpo.',
      'Distribua 5 Pontos de Sonhar entre os cinco Domínios; máximo 3 em um Domínio no nível 1.',
      'Defina Recursos, equipamentos, uma Ancoragem e os Vínculos do Desvelado.'
    ],
    keywords: ['criar personagem', 'criação', 'desvelado', 'conceito', 'atributos', 'nível 1', 'ficha'],
    art: 'dream',
    featured: true
  },
  {
    id: 'recursos-desvelado',
    category: 'desvelados',
    eyebrow: 'Ficha',
    title: 'Valores essenciais do Desvelado',
    summary: 'PV, Resistência, Defesa, Foco, PO e Ruptura.',
    answer: 'Os valores principais ligam a resistência física, a capacidade de agir e a relação com o Sonhar.',
    details: [
      'PV: 4 nos níveis 1–2 e 5 nos níveis 3–5.',
      'Resistência = 6 + Corpo.',
      'Defesa = 8 + Corpo.',
      'Foco: 4 PF no nível 1; antes de um Teste, gaste no máximo 1 PF para +2.',
      'Proteção Onírica: 2 PO; após comparar dano à Resistência, gaste no máximo 1 PO para reduzir a perda em 1 PV.',
      'Ruptura: trilha de 0 a 6.'
    ],
    keywords: ['vida', 'pv', 'resistência', 'defesa', 'foco', 'pf', 'proteção onírica', 'po', 'ruptura'],
    art: 'dice'
  },
  {
    id: 'progressao',
    category: 'desvelados',
    eyebrow: 'Progressão',
    title: 'Progressão de nível',
    summary: 'O avanço acompanha a história, não uma barra de XP.',
    answer: 'Reinos Oníricos não estabelece uma quantidade fixa de experiência ou sessões. Mestre e Jogadores determinam quando os acontecimentos justificam uma nova etapa da jornada.',
    details: [
      'Nível 2: +1 Foco, total 7 Pontos de Sonhar, Domínio máximo 3.',
      'Nível 3: +1 PV, +1 Atributo, total 8 Pontos de Sonhar, Domínio máximo 4.',
      'Nível 4: +1 Foco, total 9 Pontos de Sonhar, Domínio máximo 4.',
      'Nível 5: +1 Atributo, total 10 Pontos de Sonhar, Domínio máximo 5.',
      'Apenas um Domínio pode alcançar nível 5.'
    ],
    keywords: ['progressão', 'subir nível', 'nível 2', 'nível 3', 'nível 4', 'nível 5', 'xp', 'experiência'],
    art: 'vortex'
  },
  {
    id: 'cena-tensao',
    category: 'combate',
    eyebrow: 'Conflito',
    title: 'Cena de Tensão',
    summary: 'Quando o tempo de resposta e a ordem das ações importam.',
    answer: 'Uma Cena de Tensão começa quando as ações passam a depender diretamente umas das outras e o tempo de resposta torna-se importante, como em combates, perseguições, fugas, invasões ou desastres.',
    details: [
      'Os Jogadores escolhem sua ordem.',
      'A estrutura alterna Ação de Jogador e Ação do Mestre.',
      'Mais Adversários não concedem automaticamente mais Ações ao Mestre.'
    ],
    keywords: ['tensão', 'iniciativa', 'rodada', 'turno', 'combate', 'perseguição', 'ordem'],
    art: 'rupture'
  },
  {
    id: 'movimento',
    category: 'combate',
    eyebrow: 'Posicionamento',
    title: 'Movimento e Correr',
    summary: 'Movimento integra a Ação e pode ser dividido.',
    answer: 'O Movimento integra a Ação e pode ser dividido antes e depois dela. O Deslocamento base é Próximo.',
    details: [
      'Correr como Ação desloca até Longe.',
      'Correr usa a Ação do Personagem e permite Deslocamento até Longe. Não exige Teste Reflexo de Corpo para simplesmente Correr.',
      'Abrir porta destrancada, pegar objeto, sacar arma ou ligar lanterna são interações simples que integram o Movimento.'
    ],
    keywords: ['movimento', 'correr', 'deslocamento', 'próximo', 'longe', 'andar'],
    art: 'dice'
  },
  {
    id: 'ataque-sonhar',
    category: 'combate',
    eyebrow: 'Ação híbrida',
    title: 'Ataque + Sonhar',
    summary: 'Uma única Ação e um único Teste Onírico.',
    answer: 'O Sonhar precisa participar diretamente da forma como o ataque é realizado. Faça apenas o Teste Onírico; a DT é 13 ou a Dificuldade do alvo, o que for maior.',
    details: [
      'Convergência: ataque e manifestação acontecem, com crítico e −1 Ruptura.',
      'Realidade vence: ataque e manifestação falham.',
      'Sonhar vence: ataque e manifestação acontecem e +1 Ruptura.',
      'Divergência: ataque e manifestação falham e +2 Ruptura.'
    ],
    keywords: ['ataque + sonhar', 'ataque sonhar', 'ataque onírico', 'dt alvo', 'convergência'],
    art: 'dream'
  },
  {
    id: 'ajudar',
    category: 'combate',
    eyebrow: 'Cooperação',
    title: 'Ajudar',
    summary: 'Use sua Ação para beneficiar a Ação de outro personagem.',
    answer: 'Se a ajuda for plausível, o aliado recebe Vantagem no próximo Teste Mundano diretamente beneficiado. Para ajudar uma manifestação do Sonhar, gaste sua Ação e reduza a DT Onírica do aliado em 2.',
    keywords: ['ajudar', 'auxílio', 'vantagem', 'reduzir dt', 'cooperação'],
    art: 'dice'
  },
  {
    id: 'acoes-mestre',
    category: 'combate',
    eyebrow: 'Turno do Mestre',
    title: 'Ações do Mestre',
    summary: 'Ative ameaça, ambiente ou narrativa.',
    answer: 'Depois de cada Ação de um Jogador, o Mestre faz sua Ação. Em geral, pode ativar um Adversário, ativar um efeito de Ambiente ou mover a narrativa.',
    details: [
      'Evite ativar sistematicamente o mesmo Adversário sem justificativa narrativa.',
      'Mais Adversários não concedem automaticamente mais Ações ao Mestre.',
      'Ataques de Adversários usam 1d20 contra a Defesa e não somam automaticamente Nível de Ameaça.'
    ],
    keywords: ['ações do mestre', 'turno do mestre', 'ativar adversário', 'ambiente', 'narrativa'],
    art: 'rupture',
    featured: true
  },
  {
    id: 'neutralizacao',
    category: 'combate',
    eyebrow: 'Conflito',
    title: 'Neutralizar um Adversário',
    summary: 'Retire a oposição efetiva sem exigir Vida 0.',
    answer: 'Um Adversário é Neutralizado quando deixa de representar oposição efetiva na Cena. Isso pode ocorrer por imobilização, aprisionamento, expulsão, convencimento, separação do objetivo ou desfazendo aquilo que sustenta um Pesadelo.',
    details: [
      'Não existe um Teste de Neutralização específico.',
      'Neutralização não reduz automaticamente Vida a 0 e não significa necessariamente morte.'
    ],
    keywords: ['neutralizar', 'neutralização', 'adversário', 'derrotar sem matar', 'vida 0'],
    art: 'rupture'
  },
  {
    id: 'dano',
    category: 'referencia',
    eyebrow: 'Sobrevivência',
    title: 'Dano, Resistência e PV',
    summary: 'Compare o dano à Resistência para converter em perda de Vida.',
    answer: 'Dano igual ou menor que a Resistência causa perda de 1 PV. Dano maior que a Resistência causa perda de 2 PV. A regra opcional de Dano Massivo causa 3 PV quando o dano supera o dobro da Resistência.',
    details: [
      'Dano crítico = valor máximo do dado + nova rolagem do dado + modificador aplicável.',
      'Proteção Onírica pode reduzir a perda de PV em 1 depois da comparação, no máximo 1 PO por ocorrência de dano.'
    ],
    keywords: ['dano', 'resistência', 'pv', 'dano massivo', 'crítico', 'proteção onírica'],
    art: 'rupture'
  },
  {
    id: 'intensidade-dano',
    category: 'referencia',
    eyebrow: 'Tabela',
    title: 'Intensidade de dano',
    summary: 'd4 Leve até d20 Onírico.',
    answer: 'A intensidade vem da consequência produzida, não do floreio da descrição.',
    details: [
      'd4 Leve: socos, chutes e impactos leves.',
      'd6 Moderado: facas, bastões e ferramentas.',
      'd8 Grave: pistolas, revólveres e lâminas grandes.',
      'd10 Severo: espingardas, fuzis e impactos violentos.',
      'd12 Devastador: armamento pesado, grandes explosões e destruição extrema.',
      'd20 Onírico: fenômenos e criaturas Oníricas poderosas; Sonhar 5.'
    ],
    keywords: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'arma', 'pistola', 'fuzil', 'dano'],
    art: 'dice'
  },
  {
    id: 'arbitragem-mestre',
    category: 'mestre',
    eyebrow: 'Condução',
    title: 'Arbitrando o Sonhar',
    summary: 'Comece pela narrativa, não por uma lista de poderes.',
    answer: 'Quando surgir uma situação inesperada, pergunte primeiro o que o Personagem está tentando fazer ou tornar real. Depois determine quais regras representam isso.',
    details: [
      'Não procure uma habilidade pronta.',
      'Identifique intenção, Domínio, nível, alcance, alvos, duração, Potência e consequência.',
      'Não negue uma manifestação só porque é criativa se ela respeitar os limites.',
      'Descrição extrema não concede resultado mecânico ilimitado.',
      'Se não souber, faça uma decisão coerente, registre e continue a sessão.'
    ],
    keywords: ['mestre', 'arbitrar', 'arbitragem', 'manifestação criativa', 'não existe poder', 'limites'],
    art: 'dream',
    featured: true
  },
  {
    id: 'misterio',
    category: 'mestre',
    eyebrow: 'Investigação',
    title: 'Mistério e Descoberta',
    summary: 'Apresente sinais, consequências e pistas por múltiplos caminhos.',
    answer: 'O Mestre não precisa revelar imediatamente a natureza do fenômeno. Apresente sinais, consequências e pistas e evite mistérios que dependam de uma única pista específica.',
    details: [
      'Informações necessárias para a história devem poder ser descobertas por caminhos diferentes.',
      'Testes podem determinar como, quando ou com quais consequências a informação é obtida, sem travar toda a história por uma falha.',
      'Estrutura útil: Sinal → Descoberta → Pressão → Revelação → Escolha.'
    ],
    keywords: ['mistério', 'investigação', 'pista', 'descoberta', 'sinal', 'revelação', 'escolha'],
    art: 'dream'
  },
  {
    id: 'pressao-cena',
    category: 'mestre',
    eyebrow: 'Ferramentas',
    title: 'Pressão e consequências',
    summary: 'Falhas devem mover a situação.',
    answer: 'Falhas e Rupturas devem mover a situação, não apenas bloquear. Use ambiente, tempo, atenção indesejada, perda de posição, Condições, Contadores, perigo ou novas escolhas.',
    keywords: ['falha', 'consequência', 'pressão', 'complicação', 'mestre', 'cena'],
    art: 'vortex'
  },
  {
    id: 'ficha-adversario',
    category: 'adversarios',
    eyebrow: 'Bestiário',
    title: 'Ficha mínima de Adversário',
    summary: 'Dificuldade, Vida, Resistência, NA, Passivas, Ações e Reações.',
    answer: 'Um Adversário precisa de Dificuldade, Vida, Resistência, Nível de Ameaça, Passivas, Ações e, quando necessário, Reações.',
    details: [
      'Ataques de Adversários usam 1d20 contra Defesa.',
      'Nível de Ameaça não é somado automaticamente a ataques.',
      'A ficha deve representar o que a ameaça faz na ficção, não apenas seus números.'
    ],
    keywords: ['adversário', 'ficha adversário', 'nível de ameaça', 'na', 'dificuldade', 'vida', 'resistência'],
    art: 'rupture',
    featured: true
  },
  {
    id: 'construir-pesadelo',
    category: 'adversarios',
    eyebrow: 'Criação',
    title: 'Construindo um Pesadelo',
    summary: 'Identidade, Pressão, Resposta, Sinergia, Limite e Economia.',
    answer: 'Os valores numéricos são apenas parte de um Pesadelo. Natureza, Habilidades e comportamento determinam como ele pressiona os Desvelados e modifica a Cena.',
    steps: [
      'Identidade: o que torna esse Pesadelo reconhecível?',
      'Pressão: que problema ele cria na Cena?',
      'Resposta: como os Desvelados podem interagir com essa pressão?',
      'Sinergia: como interage com outras ameaças?',
      'Limite: o que restringe sua principal capacidade?',
      'Economia: a consequência produzida justifica o custo da Ação?'
    ],
    keywords: ['pesadelo', 'criar pesadelo', 'criação adversário', 'pressão', 'sinergia', 'limite', 'economia'],
    art: 'rupture'
  },
  {
    id: 'natureza-onirica',
    category: 'adversarios',
    eyebrow: 'Natureza',
    title: 'Natureza das Criaturas Oníricas',
    summary: 'A aparência não garante que um aspecto realmente exista.',
    answer: 'Só é possível perceber ou manipular com um Domínio um aspecto que realmente exista naquela criatura. Aparência humana não garante Vida, Substância convencional ou Consciência reconhecível.',
    details: [
      'A ausência de um aspecto não torna a criatura imune ao Domínio em toda a Cena.',
      'Percepção Onírica pode revelar a ausência daquele aspecto.',
      'Níveis capazes de Criar ou Sonhar seguem suas próprias possibilidades e limitações.'
    ],
    keywords: ['natureza', 'criatura onírica', 'vida', 'consciência', 'substância', 'imunidade', 'pesadelo'],
    art: 'dream'
  },
  {
    id: 'mundo-responde',
    category: 'mundo',
    eyebrow: 'Cenário',
    title: 'O mundo deve responder',
    summary: 'As ações dos Desvelados deixam marcas.',
    answer: 'Reinos Oníricos funciona melhor quando o mundo não retorna ao estado anterior depois de cada aventura. Pessoas, organizações, Círculos e fenômenos aprendem e mudam em resposta às ações dos personagens.',
    details: [
      'Uso frequente do Sonhar diante de Velados chama atenção.',
      'Interferir em operações da DCR faz a organização aprender sobre o grupo.',
      'Negociar com Dissonantes pode atrair o interesse de outros Círculos.',
      'Rupturas repetidas em um mesmo lugar podem transformar esse lugar.'
    ],
    keywords: ['mundo', 'dcr', 'dissonantes', 'círculos', 'consequências', 'cenário', 'velados'],
    art: 'rupture'
  },
  {
    id: 'dcr-dissonantes',
    category: 'mundo',
    eyebrow: 'Facções',
    title: 'DCR e Dissonantes',
    summary: 'Não são lados absolutos de bem e mal.',
    answer: 'A DCR e os Dissonantes funcionam melhor quando suas crenças produzem escolhas. Uma organização pode proteger pessoas em uma situação e se tornar oposição em outra.',
    details: [
      'A DCR pode conter uma manifestação perigosa e também decidir que um Desvelado precisa ser preso.',
      'Um Círculo Dissonante pode ajudar os personagens e, depois, provocar uma Ruptura que coloca outras pessoas em risco.',
      'A pergunta central pode ser menos “quem é o inimigo?” e mais “quem está certo desta vez?”.'
    ],
    keywords: ['dcr', 'dissonantes', 'círculo', 'facção', 'organização', 'mundo'],
    art: 'rupture'
  },
  {
    id: 'criticos',
    category: 'regras',
    eyebrow: 'Testes',
    title: 'Críticos',
    summary: '20 natural no Mundano; Convergência no Onírico.',
    answer: 'Críticos seguem regras diferentes em Testes Mundanos e Oníricos e alteram o dano quando ele existir.',
    keywords: ['crítico', 'critico', '20 natural', 'convergência', 'dano crítico'],
    art: 'dice'
  },
  {
    id: 'distancias',
    category: 'regras',
    eyebrow: 'Posicionamento',
    title: 'Distâncias',
    summary: 'Corpo a Corpo, Muito Próximo, Próximo, Longe, Muito Longe e Além.',
    answer: 'As faixas de distância traduzem posicionamento narrativo em referências objetivas para Movimento, ataques e Sonhar.',
    keywords: ['distância', 'distancias', 'corpo a corpo', 'muito próximo', 'próximo', 'longe', 'muito longe', 'além'],
    art: 'dice'
  },
  {
    id: 'visao-cobertura',
    category: 'regras',
    eyebrow: 'Percepção',
    title: 'Visão, audição e cobertura',
    summary: 'Sentidos indisponíveis e cobertura alteram Testes Mundanos.',
    answer: 'Escuridão, cegueira, surdez e cobertura podem impor Desvantagem ou tornar uma ação impossível quando um requisito indispensável deixa de existir.',
    keywords: ['visão', 'audição', 'cobertura', 'escuridão', 'cegueira', 'surdez', 'linha de visão'],
    art: 'dice'
  },
  {
    id: 'movimento-morte',
    category: 'regras',
    eyebrow: 'Sobrevivência',
    title: 'Movimento de Morte',
    summary: 'Ao chegar a 0 PV, Realidade e Sonhar decidem o destino.',
    answer: 'Ao chegar a 0 PV, role 2d20 sem Atributo, um de Realidade e um de Sonhar, cada um contra DT 13.',
    keywords: ['morte', '0 pv', 'movimento de morte', 'estabiliza', 'inconsciente', 'morrer'],
    art: 'rupture'
  },
  {
    id: 'principios-sonhar',
    category: 'sonhar',
    eyebrow: 'Fundamentos',
    title: 'Princípios do Sonhar',
    summary: 'Intenção, Domínio, nível, narrativa e Teste Onírico.',
    answer: 'O Onírico não possui lista de poderes. O sistema parte da intenção do Jogador e dos limites estabelecidos pelos Domínios e níveis.',
    keywords: ['sonhar', 'princípios', 'intenção', 'nível conhecido', 'nível efetivo'],
    art: 'dream'
  },
  {
    id: 'percepcao-onirica',
    category: 'sonhar',
    eyebrow: 'Domínios',
    title: 'Percepção Onírica',
    summary: 'O nível 1 permite Conhecer e Perceber um aspecto.',
    answer: 'Perceber ou interpretar algo presente não exige Teste Onírico, mas a percepção não é onisciência.',
    keywords: ['percepção onírica', 'perceber', 'conhecer', 'nível 1', 'domínio'],
    art: 'dream'
  },
  {
    id: 'alcance-sonhar',
    category: 'sonhar',
    eyebrow: 'Manifestação',
    title: 'Alcance do Sonhar',
    summary: 'O nível efetivo define até onde a manifestação chega.',
    answer: 'O alcance máximo cresce com o nível efetivo e, acima de Muito Próximo, depende do Domínio Espaço no nível correspondente.',
    keywords: ['alcance', 'sonhar', 'espaço', 'muito próximo', 'longe', 'além'],
    art: 'dream'
  },
  {
    id: 'duracao-sonhar',
    category: 'sonhar',
    eyebrow: 'Manifestação',
    title: 'Duração do Sonhar',
    summary: 'Instantâneo, Rodada ou Cena conforme o nível.',
    answer: 'A duração sustenta a alteração, mas não apaga consequências já produzidas.',
    keywords: ['duração', 'duracao', 'rodada', 'cena', 'instantâneo', 'sonhar'],
    art: 'dream'
  },
  {
    id: 'combinacao-dominios',
    category: 'sonhar',
    eyebrow: 'Domínios',
    title: 'Combinação de Domínios',
    summary: 'O principal deve estar pelo menos 1 nível acima de cada secundário.',
    answer: 'Combine Domínios apenas quando aspectos diferentes precisarem ser manipulados diretamente.',
    keywords: ['combinação', 'domínios', 'dominio principal', 'secundário', 'potência'],
    art: 'dream'
  },
  {
    id: 'tentativas-sucessivas',
    category: 'sonhar',
    eyebrow: 'Arbitragem',
    title: 'Tentativas sucessivas',
    summary: 'Depois de falhar, algo relevante precisa mudar.',
    answer: 'Não repita o mesmo teste até obter sucesso. Mude alvo, circunstâncias, uso do Domínio ou outro elemento relevante.',
    keywords: ['tentativas sucessivas', 'repetir teste', 'falha', 'sonhar'],
    art: 'dream'
  },
  {
    id: 'objetos-estruturas',
    category: 'sonhar',
    eyebrow: 'Potência',
    title: 'Objetos e Estruturas',
    summary: 'Resistência estrutural substitui PV.',
    answer: 'Objetos e estruturas não precisam de PV; compare o dano diretamente à Resistência estrutural.',
    keywords: ['objetos', 'estruturas', 'resistência estrutural', 'material', 'quebrar'],
    art: 'vortex'
  },
  {
    id: 'vida-cura-ferimento',
    category: 'sonhar',
    eyebrow: 'Vida',
    title: 'Vida: Cura e Ferimento',
    summary: 'O nível do Domínio Vida define a profundidade da alteração biológica.',
    answer: 'Toda cura ou agressão deve explicar a alteração biológica; recuperar PV não substitui a avaliação de nível.',
    keywords: ['vida', 'cura', 'ferimento', 'recuperar pv', 'tecido', 'ressuscitar'],
    art: 'dream'
  },
  {
    id: 'efeitos-ativos',
    category: 'sonhar',
    eyebrow: 'Conflitos',
    title: 'Efeitos ativos e DT do Sonhar',
    summary: 'Como agir contra uma manifestação que já está em efeito.',
    answer: 'A manifestação acontece primeiro; um teste contra a DT do Sonhar só ocorre quando alguém tenta agir diretamente contra o efeito.',
    keywords: ['efeitos ativos', 'dt do sonhar', 'manifestação ativa', 'resistir manifestação'],
    art: 'vortex'
  },
  {
    id: 'conflitos-personagens',
    category: 'sonhar',
    eyebrow: 'Conflitos',
    title: 'Conflitos entre Personagens',
    summary: 'Como resolver disputas Mundanas e Oníricas.',
    answer: 'Conflitos Mundanos usam resultados opostos; conflitos Oníricos preservam os resultados individuais e, quando necessário, usam desempate Onírico.',
    keywords: ['conflito entre personagens', 'pvp', 'desempate', 'teste oposto'],
    art: 'vortex'
  },
  {
    id: 'acoes-jogador',
    category: 'combate',
    eyebrow: 'Cena de Tensão',
    title: 'Ações do Jogador',
    summary: 'Ataques, manobras, Sonhar, ajuda, interação e corrida.',
    answer: 'Em uma Cena de Tensão, o Jogador escolhe sua Ação conforme a ficção e as opções previstas nas regras.',
    keywords: ['ações do jogador', 'ataque', 'agarrar', 'derrubar', 'imobilizar', 'interagir', 'correr'],
    art: 'dice'
  },
  {
    id: 'quando-nao-pedir-teste',
    category: 'mestre',
    eyebrow: 'Arbitragem',
    title: 'Quando não pedir teste',
    summary: 'Sem incerteza relevante ou consequência interessante, não role.',
    answer: 'Não use testes para impedir ações impossíveis pela ficção nem transforme investigação em uma sequência obrigatória de rolagens.',
    keywords: ['quando não rolar', 'não pedir teste', 'investigação', 'incerteza', 'consequência'],
    art: 'dice'
  },
  {
    id: 'delirio-mesa',
    category: 'mestre',
    eyebrow: 'Condução',
    title: 'Delírio em mesa',
    summary: 'Como avaliar se um Velado realmente testemunhou o impossível.',
    answer: 'Considere clareza, explicação plausível e intensidade da manifestação antes de aplicar Delírio.',
    keywords: ['delírio em mesa', 'velado', 'moderado', 'intenso', 'esquecimento'],
    art: 'rupture'
  },
  {
    id: 'referencia-rapida',
    category: 'referencia',
    eyebrow: 'Mesa',
    title: 'Referência rápida',
    summary: 'O essencial para não quebrar o ritmo da sessão.',
    answer: 'Use esta referência quando precisar resolver a mesa em segundos: Teste Mundano 1d20 + Atributo; Teste Onírico 2d20 + Atributo; DT Onírica normalmente 13; Resistência 6 + Corpo; Defesa 8 + Corpo; Foco pode conceder +2 antes de um Teste.',
    details: [
      'Dano ≤ R: −1 PV; Dano > R: −2 PV.',
      'PO pode reduzir a perda em 1 PV, no máximo 1 por ocorrência.',
      'Ruptura 6: resolve a manifestação, cria Efeito de Ruptura e volta a 0.',
      'Movimento base: Próximo.',
      'Turno do Mestre: ativar Adversário, ambiente ou mover a narrativa.'
    ],
    keywords: ['referência rápida', 'resumo', 'mesa', 'regra rápida', 'dt', 'vida', 'defesa', 'resistência'],
    art: 'dice',
    featured: true
  }
];

export const DEFAULT_COMPENDIUM_ENTRY_ID = 'teste-mundano';

export const DT_REFERENCE = [
  { value: '8', label: 'Trivial' },
  { value: '10', label: 'Fácil' },
  { value: '12', label: 'Comum' },
  { value: '14', label: 'Desafiador' },
  { value: '16', label: 'Difícil' },
  { value: '18', label: 'Muito difícil' },
  { value: '20', label: 'Extraordinário' },
  { value: '>20', label: 'Onírico' }
] as const;
