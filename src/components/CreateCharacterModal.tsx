import React, { useEffect, useState } from 'react';
import { X, Check, UserPlus, ImagePlus, Upload, Link2, Shield, Heart, Sparkles, Anchor, Moon, Eye, Brain, Waves, Box, Leaf, Flame } from 'lucide-react';
import { Personagem, AtributoNome, DominioNome } from '../types/character';
import { TABELA_PROGRESSAO } from '../rules/rulesData';
import { calcularResistencia, calcularDefesa, calcularVidaMaxima, validarDistribuicaoDominios } from '../rules/rulesEngine';

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
  const [conceito, setConceito] = useState<'Lúcido' | 'Tecelão' | 'Desperto' | 'Ecoante'>('Lúcido');
  const [atributoPrincipal, setAtributoPrincipal] = useState<AtributoNome>('mente');
  
  const [atributos, setAtributos] = useState({
    corpo: 2,
    mente: 1,
    vontade: 0,
    vinculo: -1
  });

  const [dominios, setDominios] = useState<Record<DominioNome, number>>({
    consciencia: 3,
    espaco: 2,
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
  const atributosBaseValidos = nivel > 1 || [...Object.values(atributos)].sort((a, b) => a - b).join(',') === '-1,0,1,2';
  const atributosValidos = Object.values(atributos).every(valor => valor >= -1 && valor <= 4)
    && somaAtributos === pontosAtributoEsperados
    && atributosBaseValidos;
  const dominiosCompletos = validacao.valida && validacao.pontosUsados === validacao.pontosTotais;
  const fichaValida = Boolean(nome.trim()) && atributosValidos && dominiosCompletos;

  const handleUpdateAtributo = (at: AtributoNome, val: number) => {
    setAtributos(prev => ({ ...prev, [at]: val }));
  };

  const handleUpdateDominio = (dom: DominioNome, val: number) => {
    setDominios(prev => ({ ...prev, [dom]: val }));
  };

  const handleCriar = async () => {
    if (!fichaValida) return;
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
      ancoragem: ancoragem.trim() || 'Um relógio de bolso antigo herdado da família.',
      vinculos: [],
      equipamentos: [
        { id: 'eq-1', nome: 'Smartphone com bateria reserva', descricao: 'Comunicação e lanterna' },
        { id: 'eq-2', nome: 'Casaco pesado impermeável', descricao: 'Vestimenta de proteção cotidiana' }
      ],
      recursos: [{ id: 'rec-1', nome: 'Recursos Estáveis', quantidade: 3, descricao: 'Nível 3 (Estável)' }],
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
  const defesa = calcularDefesa(atributoPrincipal, atributos, nivel).defesa;
  const hasInvalidFields = !atributosValidos || !dominiosCompletos;
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
            <p>Ficha inicial · Regras do Livro Básico · Níveis 1 a 5</p>
          </div>
          <button className="ro-character-create-icon-button" type="button" onClick={onClose} disabled={salvando} aria-label="Fechar criação de Desvelado">
            <X size={21} />
          </button>
        </header>

        <div className="ro-character-create-scroll">
          <div className="ro-character-create-layout">
            <form id="ro-create-character-form" className="ro-character-create-form" onSubmit={event => { event.preventDefault(); void handleCriar(); }}>
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
                  <label>Conceito do Desvelado
                    <select value={conceito} onChange={event => setConceito(event.target.value as typeof conceito)}>
                      {(['Lúcido','Tecelão','Desperto','Ecoante'] as const).map(value => <option key={value} value={value}>{value}</option>)}
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

              <section className="ro-character-create-section" aria-labelledby="ro-create-attributes">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-attributes">Atributos</h3>
                  <span>Escolha o atributo principal e distribua os valores do nível.</span>
                </div>
                <p className={atributosValidos ? 'ro-character-create-score is-valid' : 'ro-character-create-score is-invalid'}>
                  Soma {somaAtributos}/{pontosAtributoEsperados} · Atributo principal: {attributeItems.find(a => a.id === atributoPrincipal)?.label}
                </p>
                <div className="ro-character-create-attributes">
                  {attributeItems.map(item => {
                    const value = atributos[item.id];
                    const principal = atributoPrincipal === item.id;
                    return <div className={principal ? 'ro-character-create-attribute is-primary' : 'ro-character-create-attribute'} key={item.id}>
                      <label className="ro-character-create-attribute-head">
                        <span>{item.symbol}{item.label}</span>
                        <input type="radio" name="principalRadio" checked={principal} onChange={() => setAtributoPrincipal(item.id)}
                          aria-label={`Definir ${item.label} como atributo principal`} />
                      </label>
                      <div className="ro-character-create-adjuster">
                        <button type="button" disabled={value <= -1} onClick={() => handleUpdateAtributo(item.id,value-1)}
                          aria-label={`Diminuir ${item.label}`}>−</button>
                        <output aria-label={`Valor de ${item.label}`}>{value >= 0 ? '+' + value : value}</output>
                        <button type="button" disabled={value >= 4 || somaAtributos >= pontosAtributoEsperados}
                          onClick={() => handleUpdateAtributo(item.id,value+1)} aria-label={`Aumentar ${item.label}`}>+</button>
                      </div>
                    </div>;
                  })}
                </div>
                {!atributosValidos && <p className="ro-character-create-validation" role="status">
                  {nivel === 1
                    ? 'No nível 1, distribua exatamente +2, +1, 0 e −1 entre os quatro atributos.'
                    : `Neste nível, os atributos devem somar ${pontosAtributoEsperados}, com valores entre −1 e +4.`}
                </p>}
              </section>

              <section className="ro-character-create-section" aria-labelledby="ro-create-stats">
                <div className="ro-character-create-section-title">
                  <h3 id="ro-create-stats">Estatísticas</h3>
                  <span>Calculadas automaticamente pela progressão oficial.</span>
                </div>
                <div className="ro-character-create-stats">
                  {[
                    {label:'PV',value:vidaMaxima,info:'Vida máxima',symbol:<Heart size={20}/>},
                    {label:'Defesa',value:defesa,info:'8 + Corpo',symbol:<Shield size={20}/>},
                    {label:'Resistência',value:resistencia,info:'6 + Corpo',symbol:<Shield size={20}/>},
                    {label:'Foco (PF)',value:prog.focoBase,info:'Nível ' + nivel,symbol:<Flame size={20}/>},
                    {label:'Proteção Onírica',value:prog.protecaoOniricaBase,info:'Nível ' + nivel,symbol:<Sparkles size={20}/>},
                    {label:'Ruptura',value:0,info:'Inicial',symbol:<Moon size={20}/>}
                  ].map(item => <div className="ro-character-create-stat" key={item.label}>
                    {item.symbol}<span>{item.label}</span><strong>{item.value}</strong><small>{item.info}</small>
                  </div>)}
                </div>
              </section>

              <section className="ro-character-create-section" aria-labelledby="ro-create-domains">
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
                      <span className="ro-character-create-domain-label">{item.symbol}{item.label}</span>
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
              </section>

              <section className="ro-character-create-section" aria-labelledby="ro-create-anchor">
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
              </section>
            </form>

            <aside className="ro-character-create-preview" aria-label="Prévia da ficha em criação">
              <div className="ro-character-create-section-title">
                <h3>Prévia da ficha</h3><span>Atualiza enquanto você preenche o formulário.</span>
              </div>
              <div className="ro-character-create-preview-portrait">
                {previewRetrato
                  ? <img src={previewRetrato} alt="Retrato selecionado para a ficha" />
                  : <div className="ro-character-create-no-portrait"><UserPlus size={44}/><span>Seu retrato aparecerá aqui</span></div>}
              </div>
              <div className="ro-character-create-preview-name">
                <h4>{nome.trim() || 'Seu Desvelado'}</h4>
                <p>Nível {nivel} · {conceito}{jogador.trim() ? ' · ' + jogador.trim() : ''}</p>
              </div>
              <div className="ro-character-create-preview-vitals">
                <div><Heart size={16}/><span>PV</span><strong>{vidaMaxima}</strong></div>
                <div><Flame size={16}/><span>Foco</span><strong>{prog.focoBase}</strong></div>
                <div><Sparkles size={16}/><span>PO</span><strong>{prog.protecaoOniricaBase}</strong></div>
                <div><Moon size={16}/><span>Ruptura</span><strong>0</strong></div>
              </div>
              <div className="ro-character-create-preview-defense"><Shield size={18}/> Defesa <strong>{defesa}</strong><small>Resistência {resistencia}</small></div>
              <div className="ro-character-create-preview-domains">
                <h5>Domínios do Sonhar <span>{validacao.pontosUsados}/{validacao.pontosTotais}</span></h5>
                {domainItems.map(item => <div key={item.id}>
                  <span>{item.symbol}{item.label}</span>
                  <div className="ro-character-create-preview-track">
                    <i style={{width: ((dominios[item.id] || 0)/5*100) + '%'}} />
                  </div>
                  <b>{dominios[item.id] || 0}</b>
                </div>)}
              </div>
              <div className="ro-character-create-preview-anchor"><Anchor size={18}/>
                <div><strong>Ancoragem</strong><p>{ancoragem.trim() || 'Seu elo com a Realidade aparecerá aqui.'}</p></div>
              </div>
              <p className="ro-character-create-preview-notice"><Eye size={15}/> Prévia visual. Sua ficha completa será criada com as regras e os recursos do sistema.</p>
            </aside>
          </div>
        </div>

        <footer className="ro-character-create-footer">
          <div aria-live="polite">
            {erroSalvar && <p className="ro-character-create-error" role="alert">{erroSalvar}</p>}
            {!erroSalvar && hasInvalidFields && <p className="ro-character-create-footnote">
              Complete a distribuição de atributos e Domínios para criar a ficha.
            </p>}
          </div>
          <div className="ro-character-create-footer-buttons">
            <button type="button" className="ro-character-create-cancel" disabled={salvando} onClick={onClose}>Cancelar</button>
            <button type="submit" form="ro-create-character-form" className="ro-character-create-submit" disabled={!fichaValida || salvando}>
              <Check size={18}/>{salvando ? 'Salvando…' : 'Criar Desvelado'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
