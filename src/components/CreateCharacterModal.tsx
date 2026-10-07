import React, { useEffect, useState } from 'react';
import { Plus, X, Check, Sparkles, UserPlus, ImagePlus, Upload, Link2 } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#11141c] border border-slate-700/80 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200 max-h-[90vh] flex flex-col font-mono text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161b26] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Chakra_Petch'] uppercase tracking-wider">
                Criar Novo Desvelado
              </h3>
              <p className="text-[11px] text-slate-400">
                Regras Oficiais do Livro Básico (Níveis 1 a 5)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Retrato */}
          <section className="rounded border border-slate-800 bg-slate-950/55 p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-28 h-28 shrink-0 overflow-hidden rounded border border-slate-700 bg-[#0d1118] flex items-center justify-center">
                {previewRetrato ? (
                  <img src={previewRetrato} alt="Prévia do retrato" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <span className="text-slate-300 block mb-1 font-semibold">Retrato do Desvelado</span>
                  <small className="text-[10px] text-slate-500">A imagem acompanha a ficha e aparece na Mesa Ao Vivo.</small>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModoImagem('upload')} className={`px-2.5 py-1.5 rounded border flex items-center gap-1.5 ${modoImagem === 'upload' ? 'border-cyan-500 text-cyan-300 bg-cyan-950/40' : 'border-slate-700 text-slate-400'}`}>
                    <Upload className="w-3.5 h-3.5" /> Arquivo
                  </button>
                  <button type="button" onClick={() => setModoImagem('url')} className={`px-2.5 py-1.5 rounded border flex items-center gap-1.5 ${modoImagem === 'url' ? 'border-cyan-500 text-cyan-300 bg-cyan-950/40' : 'border-slate-700 text-slate-400'}`}>
                    <Link2 className="w-3.5 h-3.5" /> URL
                  </button>
                </div>
                {modoImagem === 'upload' ? (
                  <label className="block cursor-pointer rounded border border-dashed border-slate-700 px-3 py-2 text-slate-400 hover:border-cyan-700">
                    <span>{imagemArquivo ? imagemArquivo.name : 'Escolher PNG, JPG, WEBP ou GIF · até 15 MB'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0] || null;
                        if (file && file.size <= 15 * 1024 * 1024 && file.type.startsWith('image/')) {
                          setImagemArquivo(file);
                          setErroSalvar('');
                        } else if (file) {
                          setErroSalvar('Use uma imagem PNG, JPG, WEBP ou GIF de até 15 MB.');
                          event.target.value = '';
                        }
                      }}
                    />
                  </label>
                ) : (
                  <input
                    type="url"
                    value={imagemUrl}
                    onChange={event => setImagemUrl(event.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>
            </div>
          </section>

          {/* Identidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Nome do Personagem:</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Clara Mendes"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Jogador / Convidado:</label>
              <input
                type="text"
                value={jogador}
                onChange={(e) => setJogador(e.target.value)}
                placeholder="Ex: Marina"
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Nível Inicial:</label>
              <select
                value={nivel}
                onChange={(e) => setNivel(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>Nível {n} ({TABELA_PROGRESSAO[n].pontosDeSonhar} Pontos de Domínio)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Conceito do Desvelado:</label>
              <select
                value={conceito}
                onChange={(e) => setConceito(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {['Lúcido', 'Tecelão', 'Desperto', 'Ecoante'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Atributos */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Atributos:</label>
              <span className={atributosValidos ? 'text-[10px] text-emerald-400' : 'text-[10px] text-rose-400'}>
                Soma {somaAtributos}/{pontosAtributoEsperados} · Defesa = 8 + Corpo
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'corpo', nome: 'Corpo' },
                { id: 'mente', nome: 'Mente' },
                { id: 'vontade', nome: 'Vontade' },
                { id: 'vinculo', nome: 'Vínculo' }
              ].map(at => {
                const chave = at.id as AtributoNome;
                const valor = atributos[chave];
                const isPrincipal = atributoPrincipal === chave;

                return (
                  <div key={at.id} className={`p-2 rounded border ${isPrincipal ? 'bg-cyan-950/50 border-cyan-500' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200">{at.nome}</span>
                      <input
                        type="radio"
                        name="principalRadio"
                        checked={isPrincipal}
                        onChange={() => setAtributoPrincipal(chave)}
                        title="Marcar como Atributo Principal"
                        className="text-cyan-500 focus:ring-cyan-500/30"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateAtributo(chave, valor - 1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-300"
                      >
                        -
                      </button>
                      <span className="font-bold text-cyan-400 text-sm">
                        {valor >= 0 ? `+${valor}` : valor}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateAtributo(chave, valor + 1)}
                        className="w-5 h-5 rounded bg-slate-800 text-slate-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!atributosValidos && (
            <div className="rounded border border-rose-900/60 bg-rose-950/30 p-2.5 text-[11px] text-rose-200">
              {nivel === 1
                ? 'No Nível 1 distribua exatamente +2, +1, 0 e -1 entre os quatro Atributos.'
                : `A progressão deste nível exige soma total ${pontosAtributoEsperados} nos Atributos, preservando o limite mínimo -1 e máximo +4.`}
            </div>
          )}

          {/* Domínios */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Distribuição de Domínios:</label>
              <span className={dominiosCompletos ? 'text-cyan-400 font-bold' : 'text-rose-400 font-bold'}>
                {validacao.pontosUsados} / {validacao.pontosTotais} Pontos (Máx {prog.dominioMaximo})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'consciencia', nome: 'Consciência' },
                { id: 'espaco', nome: 'Espaço' },
                { id: 'fluxo', nome: 'Fluxo' },
                { id: 'substancia', nome: 'Substância' },
                { id: 'vida', nome: 'Vida' }
              ].map(d => {
                const chave = d.id as DominioNome;
                const nv = dominios[chave] || 0;

                return (
                  <div key={d.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-200">{d.nome}</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5].map(lvl => {
                        const acimaLimite = lvl > prog.dominioMaximo;
                        const ativo = lvl === nv;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            disabled={acimaLimite}
                            onClick={() => handleUpdateDominio(chave, lvl)}
                            className={`w-5 h-5 rounded text-[10px] font-bold border ${
                              acimaLimite
                                ? 'bg-slate-950/40 border-slate-900 text-slate-700 cursor-not-allowed'
                                : ativo
                                ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ancoragem */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Ancoragem (Elo com a Realidade):</label>
            <input
              type="text"
              value={ancoragem}
              onChange={(e) => setAncoragem(e.target.value)}
              placeholder="Ex: Uma fita cassete antiga com a voz do meu irmão..."
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

        {erroSalvar ? (
          <div className="mx-5 mb-0 rounded border border-amber-700/60 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-100">
            {erroSalvar}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-800 bg-[#161b26] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCriar}
            disabled={!fichaValida || salvando}
            className={`px-4 py-1.5 text-slate-950 font-bold bg-cyan-400 rounded shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition ${fichaValida ? 'hover:bg-cyan-300' : 'opacity-50 cursor-not-allowed'}`}
          >
            <Check className="w-4 h-4" />
            {salvando ? 'Salvando…' : 'Criar Desvelado'}
          </button>
        </div>

      </div>
    </div>
  );
};
