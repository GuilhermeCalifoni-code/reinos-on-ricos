import React, { useEffect, useState } from 'react';
import { X, Check, UserPlus, ImagePlus, Upload, Link2, Shield, Heart, Sparkles, Anchor, Eye, Brain, Waves, Box, Leaf, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Personagem, AtributoNome, DominioNome } from '../types/character';
import { TABELA_PROGRESSAO } from '../rules/rulesData';
import { calcularResistencia, calcularDefesa, calcularVidaMaxima, validarDistribuicaoDominios } from '../rules/rulesEngine';
import { validarFichaDesvelado, ATRIBUTO_ROTULOS } from '../rules/fichaContrato';

type Conceito = 'Lúcido' | 'Tecelão' | 'Desperto' | 'Ecoante';

// Tabela "Conceito dos Desvelados" (Livro Básico VF18, p. 10).
const CONCEITOS: { id: Conceito; diante: string; relacao: string }[] = [
  { id: 'Lúcido', diante: 'Impõe sua vontade', relacao: 'Busca exercer sua intenção sobre o Onírico e determinar aquilo que deve acontecer.' },
  { id: 'Tecelão', diante: 'Imaginou outro caminho', relacao: 'Enxerga possibilidades além dos limites aparentes.' },
  { id: 'Desperto', diante: 'Procurou compreender', relacao: 'Busca padrões, relações e regras mesmo naquilo que parece desafiar qualquer lógica.' },
  { id: 'Ecoante', diante: 'Permitiu-se sentir', relacao: 'Percebe emoções, memórias e ressonâncias no Sonhar e permite que essa experiência o atravesse.' }
];

// Descrição dos Atributos (Livro Básico VF18, pp. 10–11).
const ATRIBUTO_DESCRICAO: Record<AtributoNome, string> = {
  corpo: 'Força física, resistência, coordenação e capacidade de agir através do corpo.',
  mente: 'Raciocínio, percepção, conhecimento e capacidade de compreender padrões.',
  vontade: 'Determinação, autocontrole, coragem e resistência à pressão.',
  vinculo: 'Conexões emocionais, sociais e simbólicas com pessoas, lugares e objetos.'
};

// O que cada Domínio manipula (Livro Básico VF18).
const DOMINIO_DESCRICAO: Record<DominioNome, string> = {
  consciencia: 'Emoção, memória, pensamento e identidade.',
  espaco: 'Posição, distância e relações espaciais.',
  fluxo: 'Ritmo, duração, processos e causalidade.',
  substancia: 'Matéria e propriedades físicas.',
  vida: 'Organismos e processos vitais.'
};

const PASSOS = ['Identidade', 'Conceito', 'Atributos', 'Sonhar', 'Ancoragem', 'Revisão'] as const;

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCriar: (novo: Personagem, imagemArquivo?: File) => void | Promise<void>;
}

export const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onCriar
}) => {
  const [nome, setNome] = useState('');
  const [jogador, setJogador] = useState('');
  const [nivel, setNivel] = useState(1);
  // Criação em passos (T1B). Nada vem escolhido pelo site, nem o Conceito.
  const [passo, setPasso] = useState(0);
  const [conceito, setConceito] = useState<Conceito | null>(null);
  // Nada vem escolhido: o jogador escolhe o Principal e distribui os valores (VF18, p. 11).
  const [atributoPrincipal, setAtributoPrincipal] = useState<AtributoNome | null>(null);

  const [atributos, setAtributos] = useState({
    corpo: 0,
    mente: 0,
    vontade: 0,
    vinculo: 0
  });

  const [dominios, setDominios] = useState<Record<DominioNome, number>>({
    consciencia: 0,
    espaco: 0,
    fluxo: 0,
    substancia: 0,
    vida: 0
  });

  const [ancoragem, setAncoragem] = useState('');
  const [modoImagem, setModoImagem] = useState<'upload' | 'url'>('upload');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');

  useEffect(() => {
    if (!imagemArquivo) {
      setPreviewImagem('');
      return;
    }
    const url = URL.createObjectURL(imagemArquivo);
    setPreviewImagem(url);
    return () => URL.revokeObjectURL(url);
  }, [imagemArquivo]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !salvando) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, salvando]);

  if (!isOpen) return null;

  const previewRetrato = modoImagem === 'upload' ? previewImagem : imagemUrl.trim();
  const prog = TABELA_PROGRESSAO[nivel] || TABELA_PROGRESSAO[1];
  const validacao = validarDistribuicaoDominios(dominios, nivel);
  const pontosAtributoEsperados = 2 + prog.pontosAtributoAdicionais;
  const somaAtributos = Object.values(atributos).reduce((total, valor) => total + valor, 0);
  // Validação central (CONTRATO_FICHA_v3): Principal com +2 obrigatório e distribuição do livro.
  const validacaoFicha = validarFichaDesvelado({ nivel, atributos, atributoPrincipal: atributoPrincipal ?? undefined, dominios }, { modo: 'criacao' });
  const atributosValidos = validarFichaDesvelado({ nivel, atributos, atributoPrincipal: atributoPrincipal ?? undefined }, { modo: 'edicao_atributos' }).erros.length === 0;
  const dominiosCompletos = validacao.valida && validacao.pontosUsados === validacao.pontosTotais;
  const pendenciasCriacao = [
    ...(nome.trim() ? [] : ['Dê um nome ao personagem.']),
    ...validacaoFicha.erros
  ];
  // O que falta em cada passo. "Próximo" só avança quando o passo atual está completo.
  const pendenciasPorPasso: string[][] = [
    nome.trim() ? [] : ['Dê um nome ao personagem.'],
    conceito ? [] : ['Escolha o Conceito do Desvelado.'],
    validarFichaDesvelado({ nivel, atributos, atributoPrincipal: atributoPrincipal ?? undefined }, { modo: 'edicao_atributos' }).erros,
    dominiosCompletos ? [] : [validacao.erros?.[0] || `Distribua todos os ${validacao.pontosTotais} Pontos de Sonhar (faltam ${validacao.pontosTotais - validacao.pontosUsados}).`],
    [],
    []
  ];
  const pendenciasPasso = pendenciasPorPasso[passo] ?? [];
  const primeiroPassoIncompleto = pendenciasPorPasso.findIndex(lista => lista.length > 0);
  const podeIrPara = (alvo: number) => alvo <= passo || primeiroPassoIncompleto === -1 || alvo <= primeiroPassoIncompleto;
  const fichaValida = pendenciasCriacao.length === 0 && atributoPrincipal !== null && conceito !== null;

  const handleUpdateAtributo = (at: AtributoNome, val: number) => {
    setAtributos(prev => ({ ...prev, [at]: val }));
  };

  // O Atributo Principal recebe obrigatoriamente +2 (VF18, p. 11): ao marcar, ele já vai para +2.
  const escolherPrincipal = (at: AtributoNome) => {
    setAtributoPrincipal(at);
    setAtributos(prev => prev[at] >= 2 ? prev : { ...prev, [at]: 2 });
  };

  const handleUpdateDominio = (dom: DominioNome, val: number) => {
    setDominios(prev => ({ ...prev, [dom]: val }));
  };

  const handleCriar = async () => {
    if (!fichaValida || !atributoPrincipal || !conceito) return;
    const resistencia = calcularResistencia(atributos.corpo);
    const defesa = calcularDefesa(atributoPrincipal, atributos, nivel).defesa;
    const vidaMaxima = calcularVidaMaxima(nivel);

    const novoPersonagem: Personagem = {
      id: 'desvelado-' + Date.now(),
      imagemUrl: modoImagem === 'url' ? (imagemUrl.trim() || undefined) : undefined,
      nome: nome.trim() || 'Novo Desvelado',
      jogador: jogador.trim() || 'Jogador',
      conceito,
      nivel,
      atributos,
      atributoPrincipal,
      resistencia,
      defesa,
      vidaAtual: vidaMaxima,
      vidaMaxima,
      focoAtual: prog.focoBase,
      focoMaximo: prog.focoBase,
      protecaoOniricaAtual: prog.protecaoOniricaBase,
      protecaoOniricaMaxima: prog.protecaoOniricaBase,
      ruptura: 0,
      historicoRuptura: [
        {
          id: 'rup-init-' + Date.now(),
          dataHora: new Date().toLocaleTimeString('pt-BR') + ' ' + new Date().toLocaleDateString('pt-BR'),
          valorAnterior: 0,
          novoValor: 0,
          motivo: 'Criação do Desvelado.',
          origem: 'manual'
        }
      ],
      dominios,
      ancoragem: ancoragem.trim(),
      vinculos: [],
      // Recursos começam em 1 (VF18, p. 14). Nada de itens inventados pelo site.
      recursosNivel: 1,
      itensGerais: [],
      avisosMigracao: [],
      percepcaoOniricaNotas: '',
      anotacoesGerais: '',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    setSalvando(true);
    setErroSalvar('');
    try {
      await onCriar(novoPersonagem, modoImagem === 'upload' ? imagemArquivo || undefined : undefined);
      onClose();
    } catch (error: any) {
      setErroSalvar(error?.message || 'Não foi possível criar o personagem.');
    } finally {
      setSalvando(false);
    }
  };


  const vidaMaxima = calcularVidaMaxima(nivel);
  const resistencia = calcularResistencia(atributos.corpo);
  const defesa = calcularDefesa(atributoPrincipal ?? 'corpo', atributos, nivel).defesa;
  const attributeItems: { id: AtributoNome; label: string; symbol: React.ReactNode }[] = [
    { id: 'corpo', label: 'Corpo', symbol: <Heart size={19} /> },
    { id: 'mente', label: 'Mente', symbol: <Brain size={19} /> },
    { id: 'vontade', label: 'Vontade', symbol: <Flame size={19} /> },
    { id: 'vinculo', label: 'Vínculo', symbol: <Anchor size={19} /> }
  ];
  const domainItems: { id: DominioNome; label: string; symbol: React.ReactNode }[] = [
    { id: 'consciencia', label: 'Consciência', symbol: <Eye size={16} /> },
    { id: 'espaco', label: 'Espaço', symbol: <Box size={16} /> },
    { id: 'fluxo', label: 'Fluxo', symbol: <Waves size={16} /> },
    { id: 'substancia', label: 'Substância', symbol: <Sparkles size={16} /> },
    { id: 'vida', label: 'Vida', symbol: <Leaf size={16} /> }
  ];

  return (
    <div className="ro-character-create-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby="ro-create-character-title" className="ro-character-create-dialog">
        <header className="ro-character-create-header">
          <span className="ro-character-create-emblem" aria-hidden="true"><UserPlus size={26} /></span>
          <div className="ro-character-create-heading">
            <span className="ro-character-create-eyebrow">REINOS ONÍRICOS · PERSONAGENS</span>
            <h2 id="ro-create-character-title">Criar novo Desvelado</h2>
            <p>Passo {passo + 1} de {PASSOS.length} · {PASSOS[passo]}</p>
          </div>
          <button className="ro-character-create-icon-button" type="button" onClick={onClose} disabled={salvando} aria-label="Fechar criação de Desvelado">
            <X size={21} />
          </button>
        </header>

        <nav className="ro-create-steps" aria-label="Passos da criação">
          <ol>
            {PASSOS.map((rotulo, i) => (
              <li key={rotulo}>
                <button type="button" disabled={!podeIrPara(i) || salvando} aria-current={i === passo ? 'step' : undefined}
                  className={i === passo ? 'is-current' : i < passo && pendenciasPorPasso[i].length === 0 ? 'is-done' : ''}
                  onClick={() => setPasso(i)}>
                  <span>{i < passo && pendenciasPorPasso[i].length === 0 ? <Check size={13}/> : i + 1}</span>{rotulo}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="ro-character-create-scroll">
          <div className="ro-character-create-layout ro-create-single">
            <form id="ro-create-character-form" className="ro-character-create-form" onSubmit={event => { event.preventDefault(); if (passo === PASSOS.length - 1) void handleCriar(); else if (pendenciasPasso.length === 0) setPasso(p => p + 1); }}>
              {passo === 0 && <>
              <section className="ro-character-create-section" aria-labelledby="ro-create-identity">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-identity">Identidade</h3>
                  <span>Quem atravessou o Véu?</span>
                </div>
                <div className="ro-character-create-fields">
                  <label>Nome do personagem <input required maxLength={120} value={nome} onChange={event => setNome(event.target.value)}
                    placeholder="Ex.: Clara Mendes" autoComplete="off" /></label>
                  <label>Jogador / convidado <input maxLength={120} value={jogador} onChange={event => setJogador(event.target.value)}
                    placeholder="Ex.: Marina" autoComplete="off" /></label>
                  <label>Nível inicial
                    <select value={nivel} onChange={event => setNivel(Number(event.target.value))}>
                      {[1,2,3,4,5].map(value =>
                        <option key={value} value={value}>Nível {value} · {TABELA_PROGRESSAO[value].pontosDeSonhar} pontos de Sonhar</option>)}
                    </select>
                  </label>
                </div>
              </section>

              <section className="ro-character-create-section" aria-labelledby="ro-create-portrait">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-portrait">Retrato</h3>
                  <span>Sua imagem também aparece na Mesa Ao Vivo.</span>
                </div>
                <div className="ro-character-create-portrait-controls">
                  <div className="ro-character-create-portrait-thumb">
                    {previewRetrato
                      ? <img src={previewRetrato} alt="Retrato selecionado do Desvelado" />
                      : <ImagePlus size={34} aria-hidden="true" />}
                  </div>
                  <div className="ro-character-create-portrait-inputs">
                    <div className="ro-character-create-image-switch" aria-label="Origem da imagem">
                      <button type="button" className={modoImagem === 'upload' ? 'is-active' : ''}
                        onClick={() => setModoImagem('upload')} aria-pressed={modoImagem === 'upload'}>
                        <Upload size={15}/> Arquivo
                      </button>
                      <button type="button" className={modoImagem === 'url' ? 'is-active' : ''}
                        onClick={() => setModoImagem('url')} aria-pressed={modoImagem === 'url'}>
                        <Link2 size={15}/> URL
                      </button>
                    </div>
                    {modoImagem === 'upload' ? (
                      <label className="ro-character-create-file">
                        <Upload size={17}/>
                        <span>{imagemArquivo ? imagemArquivo.name : 'Escolher imagem · PNG, JPG, WEBP ou GIF · até 15 MB'}</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={event => {
                            const file = event.target.files?.[0] || null;
                            if (file && file.size <= 15 * 1024 * 1024 &&
                              ['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) {
                              setImagemArquivo(file);
                              setErroSalvar('');
                            } else if (file) {
                              setErroSalvar('Use PNG, JPG, WEBP ou GIF de até 15 MB.');
                              event.target.value = '';
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <label>Endereço da imagem
                        <input type="url" value={imagemUrl} placeholder="https://exemplo.com/retrato.png"
                          onChange={event => setImagemUrl(event.target.value)}/>
                      </label>
                    )}
                  </div>
                </div>
              </section>

              </>}

              {passo === 1 && <section className="ro-character-create-section" aria-labelledby="ro-create-concept">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-concept">Conceito</h3>
                  <span>Quando tudo aquilo que conhecia deixou de fazer sentido, como seu Personagem conseguiu seguir adiante? (Livro Básico, p. 10)</span>
                </div>
                <div className="ro-create-concepts" role="radiogroup" aria-label="Conceito do Desvelado">
                  {CONCEITOS.map(c => (
                    <button type="button" role="radio" aria-checked={conceito === c.id} key={c.id}
                      className={conceito === c.id ? 'is-selected' : ''} onClick={() => setConceito(c.id)}>
                      <strong>{c.id}</strong>
                      <em>Diante do impossível… {c.diante.toLowerCase()}.</em>
                      <span>{c.relacao}</span>
                    </button>
                  ))}
                </div>
                <p className="ro-create-note">O Conceito não limita o que o Desvelado pode manifestar; os Domínios fazem isso. Ele muda a maneira como o Sonhar aparece na narrativa.</p>
              </section>}

              {passo === 2 && <section className="ro-character-create-section" aria-labelledby="ro-create-attributes">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-attributes">Atributos</h3>
                  <span>Marque o Atributo Principal: ele recebe +2 e é o usado nos Testes Oníricos. {nivel <= 2 ? 'Distribua +1, 0 e −1 nos outros três.' : `Neste nível os atributos somam ${pontosAtributoEsperados}.`}</span>
                </div>
                <p className={atributosValidos ? 'ro-character-create-score is-valid' : 'ro-character-create-score is-invalid'}>
                  Soma {somaAtributos}/{pontosAtributoEsperados} · Atributo principal: {atributoPrincipal ? ATRIBUTO_ROTULOS[atributoPrincipal] : 'escolha um'}
                </p>
                <div className="ro-character-create-attributes">
                  {attributeItems.map(item => {
                    const value = atributos[item.id];
                    const principal = atributoPrincipal === item.id;
                    return <div className={principal ? 'ro-character-create-attribute is-primary' : 'ro-character-create-attribute'} key={item.id}>
                      <label className="ro-character-create-attribute-head">
                        <span>{item.symbol}{item.label}</span>
                        <input type="radio" name="principalRadio" checked={principal} onChange={() => escolherPrincipal(item.id)}
                          aria-label={`Definir ${item.label} como atributo principal`} />
                      </label>
                      <small className="ro-create-attr-desc">{ATRIBUTO_DESCRICAO[item.id]}</small>
                      <div className="ro-character-create-adjuster">
                        <button type="button" disabled={value <= -1} onClick={() => handleUpdateAtributo(item.id,value-1)}
                          aria-label={`Diminuir ${item.label}`}>−</button>
                        <output aria-label={`Valor de ${item.label}`}>{value >= 0 ? '+' + value : value}</output>
                        <button type="button" disabled={value >= 4}
                          onClick={() => handleUpdateAtributo(item.id,value+1)} aria-label={`Aumentar ${item.label}`}>+</button>
                      </div>
                    </div>;
                  })}
                </div>
                {!atributosValidos && <p className="ro-character-create-validation" role="status">
                  {nivel <= 2
                    ? 'Distribua exatamente +2, +1, 0 e −1 entre os quatro atributos. O +2 vai obrigatoriamente no Atributo Principal.'
                    : `Neste nível, os atributos devem somar ${pontosAtributoEsperados} e o Atributo Principal precisa ter pelo menos +2.`}
                </p>}
              </section>}

              {passo === 3 && <section className="ro-character-create-section" aria-labelledby="ro-create-domains">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-domains">Domínios do Sonhar</h3>
                  <span>Distribua os pontos sem ultrapassar o limite por Domínio.</span>
                </div>
                <p className={dominiosCompletos ? 'ro-character-create-score is-valid' : 'ro-character-create-score is-invalid'}>
                  {validacao.pontosUsados}/{validacao.pontosTotais} pontos · Máximo {prog.dominioMaximo} por Domínio
                </p>
                <div className="ro-character-create-domains">
                  {domainItems.map(item => {
                    const selected = dominios[item.id] || 0;
                    return <div className="ro-character-create-domain" key={item.id}>
                      <span className="ro-character-create-domain-label">{item.symbol}{item.label}<small>{DOMINIO_DESCRICAO[item.id]}</small></span>
                      <div className="ro-character-create-domain-values" role="group" aria-label={`Nível de ${item.label}`}>
                        {[0,1,2,3,4,5].map(value => <button type="button" key={value}
                          className={value === selected ? 'is-selected' : ''}
                          aria-pressed={selected === value}
                          disabled={value > prog.dominioMaximo || (value > selected && validacao.pontosUsados - selected + value > validacao.pontosTotais)}
                          onClick={() => handleUpdateDominio(item.id,value)}>{value}</button>)}
                      </div>
                    </div>;
                  })}
                </div>
                {!dominiosCompletos && <p className="ro-character-create-validation" role="status">
                  {validacao.erros?.[0] || 'Distribua todos os pontos de Domínio para continuar.'}
                </p>}
              </section>}

              {passo === 4 && <section className="ro-character-create-section" aria-labelledby="ro-create-anchor">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-anchor">Ancoragem</h3>
                  <span>Pessoa, lembrança, objeto ou lugar que mantém seu vínculo com a Realidade.</span>
                </div>
                <label className="ro-character-create-anchor-field">
                  <span>Seu elo com a Realidade</span>
                  <input type="text" maxLength={500} value={ancoragem}
                    onChange={event => setAncoragem(event.target.value)}
                    placeholder="Ex.: Uma fita cassete antiga com a voz do meu irmão…"/>
                </label>
                <p className="ro-create-note">Pode deixar para depois: dá para preencher a Ancoragem na ficha.</p>
              </section>}

              {passo === 5 && <section className="ro-character-create-section" aria-labelledby="ro-create-review">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-review">Revisão</h3>
                  <span>Confira antes de criar. Os números são calculados pelas regras do livro.</span>
                </div>
                <div className="ro-create-review">
                  <div className="ro-create-review-id">
                    <div className="ro-character-create-portrait-thumb">
                      {previewRetrato ? <img src={previewRetrato} alt="Retrato do Desvelado" /> : <UserPlus size={34} aria-hidden="true" />}
                    </div>
                    <div>
                      <h4>{nome.trim() || 'Seu Desvelado'}</h4>
                      <p>Nível {nivel} · {conceito ?? 'sem Conceito'}{jogador.trim() ? ' · ' + jogador.trim() : ''}</p>
                      <p>Atributo Principal: <strong>{atributoPrincipal ? ATRIBUTO_ROTULOS[atributoPrincipal] : '—'}</strong></p>
                    </div>
                  </div>
                  <div className="ro-character-create-stats">
                    {[
                      {label:'PV',value:vidaMaxima,info:'Vida máxima',symbol:<Heart size={20}/>},
                      {label:'Foco (PF)',value:prog.focoBase,info:'Nível ' + nivel,symbol:<Flame size={20}/>},
                      {label:'Proteção Onírica',value:prog.protecaoOniricaBase,info:'Nível ' + nivel,symbol:<Sparkles size={20}/>},
                      {label:'Defesa',value:defesa,info:'8 + Corpo',symbol:<Shield size={20}/>},
                      {label:'Resistência',value:resistencia,info:'6 + Corpo',symbol:<Shield size={20}/>}
                    ].map(item => <div className="ro-character-create-stat" key={item.label}>
                      {item.symbol}<span>{item.label}</span><strong>{item.value}</strong><small>{item.info}</small>
                    </div>)}
                  </div>
                  <dl className="ro-create-review-list">
                    <div><dt>Atributos</dt><dd>{attributeItems.map(a => `${a.label} ${atributos[a.id] >= 0 ? '+' : ''}${atributos[a.id]}`).join(' · ')}</dd></div>
                    <div><dt>Domínios</dt><dd>{domainItems.filter(d => (dominios[d.id] || 0) > 0).map(d => `${d.label} ${dominios[d.id]}`).join(' · ') || '—'}</dd></div>
                    <div><dt>Ancoragem</dt><dd>{ancoragem.trim() || 'A preencher depois'}</dd></div>
                    <div><dt>Recursos</dt><dd>1 (Escasso), como manda o livro</dd></div>
                  </dl>
                </div>
              </section>}
            </form>

          </div>
        </div>

        <footer className="ro-character-create-footer">
          <div aria-live="polite">
            {erroSalvar && <p className="ro-character-create-error" role="alert">{erroSalvar}</p>}
            {!erroSalvar && pendenciasPasso.length > 0 && <div className="ro-character-create-footnote">
              <strong>Para continuar, falta:</strong>
              <ul>
                {pendenciasPasso.map(p => <li key={p}>{p}</li>)}
              </ul>
            </div>}
          </div>
          <div className="ro-character-create-footer-buttons">
            {passo === 0
              ? <button type="button" className="ro-character-create-cancel" disabled={salvando} onClick={onClose}>Cancelar</button>
              : <button type="button" className="ro-character-create-cancel" disabled={salvando} onClick={() => setPasso(p => p - 1)}><ChevronLeft size={17}/> Voltar</button>}
            {passo < PASSOS.length - 1
              ? <button type="button" className="ro-character-create-submit" disabled={pendenciasPasso.length > 0}
                  onClick={() => setPasso(p => p + 1)}>Próximo: {PASSOS[passo + 1]} <ChevronRight size={17}/></button>
              : <button type="submit" form="ro-create-character-form" className="ro-character-create-submit" disabled={!fichaValida || salvando}>
                  <Check size={18}/>{salvando ? 'Salvando…' : 'Criar Desvelado'}
                </button>}
          </div>
        </footer>
      </div>
    </div>
  );
};
