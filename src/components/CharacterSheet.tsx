import React, { useCallback, useRef, useState } from 'react';
import {
  Anchor, AlertTriangle, Archive, BookOpen, Brain, CheckCircle2, Copy, Dice5,
  Download, Eye, Flame, Heart, Moon, Plus, Shield, Sparkles, Trash2, Waves,
  X, Zap, Camera
} from 'lucide-react';
import { Personagem, AtributoNome, DominioNome, VinculoItem, ItemGeral, RecursosNivel } from '../types/character';
import { AVISO_RECURSOS_AJUSTADOS_P1, RECURSOS_ROTULOS, normalizarPersonagem, problemasDeAtributos, validarFichaDesvelado } from '../rules/fichaContrato';
import { TABELA_PROGRESSAO, DESCRICAO_DOMINIOS } from '../rules/rulesData';
import { calcularDefesa, calcularResistencia, validarDistribuicaoDominios } from '../rules/rulesEngine';
import { RupturaModal } from './RupturaModal';
import { ajustarRuptura } from '../rules/rupturaRapida';
import { RestModal } from './RestModal';
import { RolagemRapida, type PedidoRolagem } from './RolagemRapida';
import type {NewSessionEvent} from '../types/sessionEvent';
import { AssetImage } from './system/AssetImage';

interface CharacterSheetProps {
  personagem: Personagem;
  onSalvar: (personagemAtualizado: Personagem) => void;
  onAlterarRetrato?: (file: File) => Promise<void>;
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
  onExportar: (personagem: Personagem) => void;
  onIrParaRolador: (personagem: Personagem, atributo?: AtributoNome) => void;
  onIrParaGuiaSonhar: (personagem: Personagem) => void;
  onDispararMovimentoMorte: () => void;
  onRegistrarRolagem?: (event:NewSessionEvent)=>Promise<unknown>|void;
}

const attributes: { key: AtributoNome; label: string; symbol: React.ReactNode; description: string }[] = [
  { key: 'corpo', label: 'Corpo', symbol: <Heart size={19}/>, description: 'Força, coordenação e resistência' },
  { key: 'mente', label: 'Mente', symbol: <Brain size={19}/>, description: 'Percepção, raciocínio e padrões' },
  { key: 'vontade', label: 'Vontade', symbol: <Flame size={19}/>, description: 'Determinação e autocontrole' },
  { key: 'vinculo', label: 'Vínculo', symbol: <Anchor size={19}/>, description: 'Conexões e identidade' }
];
const domains: { key: DominioNome; label: string; symbol: React.ReactNode }[] = [
  { key: 'consciencia', label: 'Consciência', symbol: <Eye size={17}/> },
  { key: 'espaco', label: 'Espaço', symbol: <Shield size={17}/> },
  { key: 'fluxo', label: 'Fluxo', symbol: <Waves size={17}/> },
  { key: 'substancia', label: 'Substância', symbol: <Sparkles size={17}/> },
  { key: 'vida', label: 'Vida', symbol: <Heart size={17}/> }
];
const damageReference = [
  ['Leve','d4','Socos, chutes, impactos leves'],
  ['Moderado','d6','Facas, bastões, armas improvisadas'],
  ['Grave','d8','Pistolas, revólveres, lâminas grandes'],
  ['Severo','d10','Espingardas, fuzis, atropelamento'],
  ['Devastador','d12','Armamento pesado, explosões'],
  ['Onírico','d20','O impossível ferindo a Realidade']
] as const;

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  personagem: personagemEntrada, onSalvar, onAlterarRetrato, onDuplicar, onExcluir, onExportar, onIrParaRolador,
  onIrParaGuiaSonhar, onDispararMovimentoMorte, onRegistrarRolagem
}) => {
  // A ficha sempre trabalha no formato novo (Recursos 1–5 e Itens Gerais), mesmo com dados antigos.
  const personagem = normalizarPersonagem(personagemEntrada);
  const [enviandoRetrato, setEnviandoRetrato] = useState(false);
  const [erroRetrato, setErroRetrato] = useState('');
  const [modalRupturaAberto,setModalRupturaAberto] = useState(false);
  const [modalDescansoAberto,setModalDescansoAberto] = useState(false);
  // Rolagem rápida: janela pequena para rolar, resultado no canto direito da tela.
  const [pedidoRolagem, setPedidoRolagem] = useState<PedidoRolagem | null>(null);
  const contadorRolagem = useRef(0);
  const pedirRolagem = (p: PedidoRolagem extends infer T ? (T extends unknown ? Omit<T,'id'> : never) : never) => setPedidoRolagem({ ...p, id: ++contadorRolagem.current } as PedidoRolagem);
  const fecharPainelRolagem = useCallback(() => setPedidoRolagem(null), []);
  // As condições eram (e continuam sendo) marcadores temporários da interface.
  const [condicoes,setCondicoes] = useState({oculto:false,impedido:false,vulneravel:false,morte:personagem.vidaAtual===0});
  const prog = TABELA_PROGRESSAO[personagem.nivel] || TABELA_PROGRESSAO[1];
  const validacao = validarDistribuicaoDominios(personagem.dominios, personagem.nivel);
  // Fichas fora da regra não são bloqueadas: os problemas aparecem como aviso (CONTRATO_FICHA_v3, §4).
  const avisosFicha = validarFichaDesvelado(personagem, { modo: 'salvar' }).avisos;
  const avisoRecursosP1 = (personagem.avisosMigracao || []).includes(AVISO_RECURSOS_AJUSTADOS_P1);

  const alterarRetrato = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onAlterarRetrato || enviandoRetrato) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      setErroRetrato('Escolha PNG, JPG, WEBP ou GIF de até 15 MB.');
      return;
    }
    setErroRetrato('');
    setEnviandoRetrato(true);
    try {
      await onAlterarRetrato(file);
    } catch (error) {
      setErroRetrato(error instanceof Error ? error.message : 'Falha ao atualizar o retrato.');
    } finally {
      setEnviandoRetrato(false);
    }
  };

  const salvar = (patch: Partial<Personagem>) =>
    onSalvar({...personagem,...patch,atualizadoEm:new Date().toISOString()});

  // Modo "editar atributos": as mudanças ficam num rascunho e só são salvas
  // quando estão dentro da regra do livro (CONTRATO_FICHA_v3, modo edicao_atributos).
  const [rascunhoAtributos, setRascunhoAtributos] = useState<{atributos:Personagem['atributos'];principal:AtributoNome}|null>(null);
  const editandoAtributos = rascunhoAtributos !== null;
  const atributosVisiveis = rascunhoAtributos?.atributos ?? personagem.atributos;
  const principalVisivel = rascunhoAtributos?.principal ?? personagem.atributoPrincipal;
  const problemasRascunho = rascunhoAtributos ? problemasDeAtributos(rascunhoAtributos.atributos, rascunhoAtributos.principal, personagem.nivel) : [];
  const iniciarEdicaoAtributos = () => setRascunhoAtributos({atributos:{...personagem.atributos},principal:personagem.atributoPrincipal});
  const cancelarEdicaoAtributos = () => setRascunhoAtributos(null);
  const editarAtributo = (key:AtributoNome,value:number) => {
    if(!rascunhoAtributos || value < -1 || value > 4 || !Number.isInteger(value))return;
    setRascunhoAtributos({...rascunhoAtributos,atributos:{...rascunhoAtributos.atributos,[key]:value}});
  };
  const definirPrincipalRascunho = (key:AtributoNome) => { if(rascunhoAtributos) setRascunhoAtributos({...rascunhoAtributos,principal:key}); };
  const salvarEdicaoAtributos = () => {
    if(!rascunhoAtributos || problemasRascunho.length>0)return;
    const {atributos,principal:atributoPrincipal}=rascunhoAtributos;
    salvar({atributos,atributoPrincipal,resistencia:calcularResistencia(atributos.corpo),
      defesa:calcularDefesa(atributoPrincipal,atributos,personagem.nivel).defesa});
    setRascunhoAtributos(null);
  };
  const editarDominio = (key:DominioNome,value:number) => {
    if(value<0||value>prog.dominioMaximo||!Number.isInteger(value))return;
    const next={...personagem.dominios,[key]:value};
    const check=validarDistribuicaoDominios(next,personagem.nivel);
    // O usuário consegue sempre diminuir um Domínio mesmo numa ficha legada inválida.
    if(check.pontosUsados>check.pontosTotais && value>personagem.dominios[key])return;
    if(personagem.nivel===5 && value===5 && domains.some(item=>item.key!==key && next[item.key]===5))return;
    salvar({dominios:next});
  };
  const editarNivel = (level:number) => {
    const next=TABELA_PROGRESSAO[level];
    if(!next)return;
    salvar({nivel:level,vidaMaxima:next.vidaBase,vidaAtual:Math.min(personagem.vidaAtual,next.vidaBase),
      focoMaximo:next.focoBase,focoAtual:Math.min(personagem.focoAtual,next.focoBase),
      protecaoOniricaMaxima:next.protecaoOniricaBase,
      protecaoOniricaAtual:Math.min(personagem.protecaoOniricaAtual,next.protecaoOniricaBase),
      defesa:calcularDefesa(personagem.atributoPrincipal,personagem.atributos,level).defesa});
  };
  const alterarRecurso = (campo:'vidaAtual'|'focoAtual'|'protecaoOniricaAtual',max:number,delta:number) => {
    const atual=personagem[campo];
    const novo=Math.max(0,Math.min(max,atual+delta));
    if(novo===atual)return;
    salvar({[campo]:novo});
    if(campo==='vidaAtual' && novo===0)onDispararMovimentoMorte();
  };
  const addVinculo = () => salvar({vinculos:[...(personagem.vinculos||[]),{
    id:`vinculo-${crypto.randomUUID()}`,nome:'',descricao:''}]});
  const editarVinculo = (id:string,patch:Partial<VinculoItem>) => salvar({vinculos:(personagem.vinculos||[]).map(item=>
    item.id===id?{...item,...patch}:item)});
  const addItemGeral = () => salvar({itensGerais:[...personagem.itensGerais,{
    id:`item-${crypto.randomUUID()}`,nome:'',quantidade:1,observacoes:''}]});
  const editarItemGeral = (id:string,patch:Partial<ItemGeral>) => salvar({itensGerais:personagem.itensGerais.map(item=>
    item.id===id?{...item,...patch}:item)});
  const removerItemGeral = (id:string) => salvar({itensGerais:personagem.itensGerais.filter(item=>item.id!==id)});
  // Mudar o nível de Recursos não toca em nenhum item (antes, trocava a lista inteira).
  const alterarRecursosNivel = (nivel:RecursosNivel) => salvar({recursosNivel:nivel});
  const dispensarAvisoP1 = () => salvar({avisosMigracao:(personagem.avisosMigracao||[]).filter(a=>a!==AVISO_RECURSOS_AJUSTADOS_P1)});
  const principal = attributes.find(item=>item.key===personagem.atributoPrincipal)?.label || 'Corpo';

  const ResourceControl=({name,icon,atual,max,campo,description}:{
    name:string; icon:React.ReactNode; atual:number; max:number;
    campo:'vidaAtual'|'focoAtual'|'protecaoOniricaAtual'; description:string;
  }) => <div className="ro-sheet__resource">
    <div className="ro-sheet__resource-top">
      <span className="ro-sheet__resource-title">{icon}{name}</span>
      <strong>{atual}<small> / {max}</small></strong>
    </div>
    <div className="ro-sheet__resource-bar" aria-label={`${name}: ${atual} de ${max}`}>
      <span style={{width:`${max>0?Math.max(0,Math.min(100,atual/max*100)):0}%`}}/>
    </div>
    <div className="ro-sheet__resource-bottom">
      <small>{description}</small>
      <div className="ro-sheet__stepper">
        <button type="button" disabled={atual<=0} onClick={()=>alterarRecurso(campo,max,-1)} aria-label={`Diminuir ${name}`}>−</button>
        <output>{atual}</output>
        <button type="button" disabled={atual>=max} onClick={()=>alterarRecurso(campo,max,1)} aria-label={`Aumentar ${name}`}>+</button>
      </div>
    </div>
  </div>;

  return <article className="ro-sheet" aria-label={`Ficha de ${personagem.nome}`}>
    <header className="ro-sheet__hero">
      <div className="ro-sheet__portrait">
        {personagem.imagemUrl
          ? <AssetImage src={personagem.imagemUrl} alt={`Retrato de ${personagem.nome}`} className="ro-sheet__portrait-image"/>
          : <div className="ro-sheet__portrait-placeholder"><img src="/ro-mark.svg" alt=""/><span>Desvelado</span></div>}
      </div>
      <div className="ro-sheet__identity">
        <span className="ro-sheet__eyebrow">REINOS ONÍRICOS · REGISTRO DO DESVELADO</span>
        {onAlterarRetrato && (
          <div className="ro-sheet__portrait-controls">
            <label className="ro-sheet__portrait-upload" aria-disabled={enviandoRetrato}>
              <Camera size={14} /> {enviandoRetrato ? 'Enviando retrato…' : (personagem.imagemUrl ? 'Trocar retrato' : 'Adicionar retrato')}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={enviandoRetrato}
                onChange={event => { void alterarRetrato(event); }} />
            </label>
            {erroRetrato && <small role="alert" className="ro-sheet__portrait-error">{erroRetrato}</small>}
          </div>
        )}
        <label className="ro-sheet__name-label">
          <span>Nome do personagem</span>
          <input type="text" maxLength={120} aria-label="Nome do Desvelado" value={personagem.nome} onChange={e=>salvar({nome:e.target.value})}/>
        </label>
        <div className="ro-sheet__identity-fields">
          <label>Jogador / convidado
            <input type="text" value={personagem.jogador||''} maxLength={120} onChange={e=>salvar({jogador:e.target.value})} placeholder="Nome do jogador"/>
          </label>
          <label>Nível
            <select value={personagem.nivel} onChange={e=>editarNivel(Number(e.target.value))} aria-label="Nível do Desvelado">
              {[1,2,3,4,5].map(value=><option key={value} value={value}>Nível {value}</option>)}
            </select>
          </label>
          <label>Conceito
            <select value={personagem.conceito} onChange={e=>salvar({conceito:e.target.value})}>
              {['Lúcido','Tecelão','Desperto','Ecoante'].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        </div>
        <p className="ro-sheet__hero-caption">A identidade muda. A Realidade permanece — até deixar de permanecer.</p>
      </div>
      <div className="ro-sheet__hero-actions" aria-label="Ações da ficha">
        <button type="button" onClick={()=>setModalDescansoAberto(true)}><Moon size={17}/> Descanso</button>
        <button type="button" aria-haspopup="dialog" onClick={()=>pedirRolagem({modo:'mundano'})}><Dice5 size={17}/> Teste Mundano</button>
        <button type="button" aria-haspopup="dialog" onClick={()=>pedirRolagem({modo:'onirico'})}><Sparkles size={17}/> Teste Onírico</button>
        <button type="button" onClick={()=>onIrParaGuiaSonhar(personagem)}><Sparkles size={17}/> Guia do Sonhar</button>
        <div className="ro-sheet__secondary-actions">
          <button type="button" title="Exportar ficha em JSON" aria-label="Exportar ficha em JSON" onClick={()=>onExportar(personagem)}><Download size={17}/></button>
          <button type="button" title="Duplicar Desvelado" aria-label="Duplicar Desvelado" onClick={()=>onDuplicar(personagem.id)}><Copy size={17}/></button>
          <button type="button" title="Excluir Desvelado" aria-label="Excluir Desvelado" className="is-danger"
            onClick={()=>{if(window.confirm(`Deseja excluir o Desvelado "${personagem.nome}"?`))onExcluir(personagem.id)}}><Trash2 size={17}/></button>
        </div>
      </div>
    </header>

    <RolagemRapida personagem={personagem} pedido={pedidoRolagem} onFecharPainel={fecharPainelRolagem}
      onSalvar={onSalvar} onRegistrarRolagem={onRegistrarRolagem}
      onAbrirRoladorCompleto={(atributo)=>onIrParaRolador(personagem,atributo)}/>
    {(avisosFicha.length>0 || avisoRecursosP1) && (
      <div className="ro-sheet__validation is-warning" role="status" aria-live="polite">
        <AlertTriangle size={16}/>
        <div>
          {avisosFicha.length>0 && <>
            <strong>Esta ficha precisa de ajuste:</strong>
            <ol>{avisosFicha.map(aviso=><li key={aviso}>{aviso}</li>)}</ol>
          </>}
          {avisoRecursosP1 && <p>
            Recursos ajustados para 1 conforme o livro (VF18, p. 14). O valor 3 tinha sido colocado automaticamente pelo site.
            {' '}<button type="button" onClick={dispensarAvisoP1}>Entendi</button>
          </p>}
        </div>
      </div>
    )}
    <div className="ro-sheet__body">
      <div className="ro-sheet__main">
        <section className="ro-sheet__section" id="sheet-attributes">
          <div className="ro-sheet__heading"><div><span className="ro-sheet__eyebrow">01 · IDENTIDADE E CAPACIDADES</span><h2>Atributos</h2></div>
            {editandoAtributos
              ? <span className="ro-sheet__section-extra">Editando atributos</span>
              : <button type="button" className="ro-sheet__edit-attrs" onClick={iniciarEdicaoAtributos}>Editar atributos</button>}
          </div>
          <p className="ro-sheet__intro">Atributo Principal define sua especialidade. A Defesa é sempre 8 + Corpo.</p>
          <div className="ro-sheet__attribute-grid">
            {attributes.map(({key,label,symbol,description})=><div className={`ro-sheet__attribute ${principalVisivel===key?'is-primary':''}`} key={key}>
              <div className="ro-sheet__attribute-head">{symbol}<strong>{label}</strong>
                {editandoAtributos
                  ? <button type="button" aria-pressed={principalVisivel===key}
                      title={`Definir ${label} como atributo principal`}
                      onClick={()=>definirPrincipalRascunho(key)}>{principalVisivel===key?'Principal':'Definir'}</button>
                  : principalVisivel===key && <span className="ro-sheet__attribute-badge">Principal</span>}
              </div>
              <span className="ro-sheet__attribute-desc">{description}</span>
              {editandoAtributos
                ? <div className="ro-sheet__stepper ro-sheet__attribute-stepper">
                    <button type="button" disabled={atributosVisiveis[key]<=-1} onClick={()=>editarAtributo(key,atributosVisiveis[key]-1)} aria-label={`Diminuir ${label}`}>−</button>
                    <output>{atributosVisiveis[key]>=0?'+':''}{atributosVisiveis[key]}</output>
                    <button type="button" disabled={atributosVisiveis[key]>=4} onClick={()=>editarAtributo(key,atributosVisiveis[key]+1)} aria-label={`Aumentar ${label}`}>+</button>
                  </div>
                : <output className="ro-sheet__attribute-value">{atributosVisiveis[key]>=0?'+':''}{atributosVisiveis[key]}</output>}
              {!editandoAtributos && <button className="ro-sheet__test" type="button" onClick={()=>pedirRolagem({modo:'mundano',atributo:key,rolarDireto:true})}><Dice5 size={15}/> Testar aqui</button>}
            </div>)}
          </div>
          {editandoAtributos ? <div className="ro-sheet__attr-editbar">
            {problemasRascunho.length===0
              ? <p className="ro-sheet__validation is-ok"><CheckCircle2 size={16}/> Atributos conforme o livro. Pode salvar.</p>
              : <div className="ro-sheet__validation is-warning"><AlertTriangle size={16}/>
                  <div><strong>Para salvar, falta:</strong><ul>{problemasRascunho.map(p=><li key={p}>{p}</li>)}</ul></div></div>}
            <div className="ro-sheet__attr-editbar-actions">
              <button type="button" className="ro-sheet__attr-cancel" onClick={cancelarEdicaoAtributos}>Cancelar</button>
              <button type="button" className="ro-sheet__attr-save" disabled={problemasRascunho.length>0} onClick={salvarEdicaoAtributos}>Salvar atributos</button>
            </div>
          </div> : <p className={`ro-sheet__validation ${avisosFicha.length===0?'is-ok':'is-warning'}`}>
            {avisosFicha.length===0?<CheckCircle2 size={16}/>:<AlertTriangle size={16}/>}
            {avisosFicha.length===0
              ? 'Atributos conforme o livro.'
              : `Atributos fora da regra (${avisosFicha.length}). Use "Editar atributos" para corrigir.`}
          </p>}
        </section>

        <section className="ro-sheet__section" id="sheet-vigil">
          <div className="ro-sheet__heading"><div><span className="ro-sheet__eyebrow">02 · VIGÍLIA</span><h2>Combate e resistência</h2></div></div>
          <div className="ro-sheet__stats">
            <div><Shield size={19}/><span>Defesa</span><strong>{personagem.defesa}</strong><small>8 + Corpo</small></div>
            <div><Zap size={19}/><span>Resistência</span><strong>{personagem.resistencia}</strong><small>6 + Corpo</small></div>
            <div><Moon size={19}/><span>Ruptura</span>
              <div className="ro-sheet__stepper ro-sheet__stepper--valor">
                <button type="button" disabled={personagem.ruptura<=0} onClick={()=>onSalvar(ajustarRuptura(personagem,-1))} aria-label="Diminuir Ruptura">−</button>
                <strong>{personagem.ruptura}<small>/6</small></strong>
                <button type="button" disabled={personagem.ruptura>=6} onClick={()=>onSalvar(ajustarRuptura(personagem,1))} aria-label="Aumentar Ruptura">+</button>
              </div>
              <small>Tensão onírica</small>
            </div>
          </div>
          <div className="ro-sheet__resource-grid">
            <ResourceControl name="Pontos de Vida" icon={<Heart size={18}/>} atual={personagem.vidaAtual} max={personagem.vidaMaxima} campo="vidaAtual" description="Vida na Vigília"/>
            <ResourceControl name="Foco (PF)" icon={<Flame size={18}/>} atual={personagem.focoAtual} max={personagem.focoMaximo} campo="focoAtual" description="Gaste 1 antes de um Teste: +2 (VF18, p. 11)"/>
            <ResourceControl name="Proteção Onírica" icon={<Shield size={18}/>} atual={personagem.protecaoOniricaAtual} max={personagem.protecaoOniricaMaxima} campo="protecaoOniricaAtual" description="Máx. 1 PO por dano"/>
          </div>
          {personagem.vidaAtual===0 && <button type="button" className="ro-sheet__death" onClick={onDispararMovimentoMorte}>Realizar Movimento de Morte <AlertTriangle size={17}/></button>}
          <div className="ro-sheet__conditions">
            <h3>Condições de combate <span>Marcadores temporários nesta visualização</span></h3>
            <div>{([
              ['oculto','Oculto','Afeta tentativas de percepção ou localização'],
              ['impedido','Impedido','Limitação física ou sensorial'],
              ['vulneravel','Vulnerável','Ações limitadas e vantagem contra o alvo'],
              ['morte','Morte','Marcador de Movimento de Morte; não muda PV automaticamente']
            ] as const).map(([key,title,description])=><button key={key} type="button" aria-pressed={condicoes[key]}
              className={condicoes[key]?'is-active':''} onClick={()=>setCondicoes(current=>({...current,[key]:!current[key]}))}>
              <strong>{title} {condicoes[key]?'· ativo':''}</strong><small>{description}</small>
            </button>)}</div>
          </div>
          <details className="ro-sheet__reference">
            <summary><BookOpen size={17}/> Tabela de intensidade de dano <span>Consultar</span></summary>
            <div className="ro-sheet__reference-scroll"><table><thead><tr><th>Intensidade</th><th>Dado</th><th>Exemplos</th></tr></thead><tbody>
              {damageReference.map(([level,die,example])=><tr key={level}><td>{level}</td><td>{die}</td><td>{example}</td></tr>)}
            </tbody></table></div>
            <p>A intensidade não substitui as definições separadas de Área e Distância Máxima.</p>
          </details>
        </section>

        <section className="ro-sheet__section" id="sheet-dream">
          <div className="ro-sheet__heading"><div><span className="ro-sheet__eyebrow">03 · O SONHAR</span><h2>Domínios do Sonhar</h2></div><span className="ro-sheet__section-extra">{validacao.pontosUsados}/{validacao.pontosTotais} pontos · Máx. {prog.dominioMaximo}</span></div>
          {!validacao.valida && <div className="ro-sheet__validation is-warning" role="status"><AlertTriangle size={17}/><span>{validacao.erros.join(' ')}</span></div>}
          <div className="ro-sheet__domains">
            {domains.map(({key,label,symbol})=><div key={key} className="ro-sheet__domain">
              <div className="ro-sheet__domain-title">{symbol}<strong>{label}</strong><small>{DESCRICAO_DOMINIOS[key].tema}</small></div>
              <div className="ro-sheet__domain-levels" role="group" aria-label={`Nível do Domínio ${label}`}>
                {[0,1,2,3,4,5].map(n=><button key={n} type="button" className={personagem.dominios[key]===n?'is-active':''}
                  aria-pressed={personagem.dominios[key]===n}
                  disabled={n>prog.dominioMaximo || (n>personagem.dominios[key] && validacao.pontosUsados-personagem.dominios[key]+n>validacao.pontosTotais)}
                  onClick={()=>editarDominio(key,n)}>{n}</button>)}
              </div>
            </div>)}
          </div>
          <div className="ro-sheet__dream-note">
            <Eye size={20}/><div><strong>Percepção Onírica</strong>
              <p>Perceber ou interpretar o que já está presente não exige Teste Onírico. Não substitui investigação.</p>
              <textarea rows={3} value={personagem.percepcaoOniricaNotas||''}
                placeholder="Sinais, impressões e manifestações percebidas..."
                onChange={e=>salvar({percepcaoOniricaNotas:e.target.value})}/>
            </div>
          </div>
        </section>

        <section className="ro-sheet__section" id="sheet-memory">
          <div className="ro-sheet__heading"><div><span className="ro-sheet__eyebrow">04 · MEMÓRIA E REALIDADE</span><h2>Ancoragem e vínculos</h2></div></div>
          <label className="ro-sheet__field"><span>Ancoragem · seu elo com a Realidade</span>
            <textarea rows={3} value={personagem.ancoragem||''}
              placeholder="Pessoa, memória, objeto ou lugar que mantém sua identidade..."
              onChange={e=>salvar({ancoragem:e.target.value})}/>
          </label>
          <div className="ro-sheet__collection-header"><h3>Vínculos e relações</h3><button type="button" onClick={addVinculo}><Plus size={17}/> Adicionar vínculo</button></div>
          <div className="ro-sheet__collection">
            {(personagem.vinculos||[]).length===0 && <p className="ro-sheet__empty">Nenhum vínculo registrado ainda.</p>}
            {(personagem.vinculos||[]).map(v=><div className="ro-sheet__collection-item" key={v.id}>
              <div><input value={v.nome} maxLength={160} onChange={e=>editarVinculo(v.id,{nome:e.target.value})} aria-label="Nome do vínculo" placeholder="Nome ou relação"/>
                <input value={v.descricao} onChange={e=>editarVinculo(v.id,{descricao:e.target.value})} aria-label="Descrição do vínculo" placeholder="O que esse vínculo significa?"/></div>
              <button type="button" onClick={()=>salvar({vinculos:(personagem.vinculos||[]).filter(item=>item.id!==v.id)})} title="Remover vínculo" aria-label={`Remover vínculo ${v.nome}`}><X size={18}/></button>
            </div>)}
          </div>
        </section>

        <section className="ro-sheet__section" id="sheet-belongings">
          <div className="ro-sheet__heading"><div><span className="ro-sheet__eyebrow">05 · PERTENCES</span><h2>Recursos e Itens Gerais</h2></div></div>
          <div className="ro-sheet__resource-level">
            <h3>Recursos <small>Trilha abstrata · 1 escasso a 5 abundante · começa em 1</small></h3>
            <div role="group" aria-label="Nível de Recursos">
              {([1,2,3,4,5] as RecursosNivel[]).map(n=><button key={n} type="button" className={personagem.recursosNivel===n?'is-active':''}
                aria-pressed={personagem.recursosNivel===n}
                onClick={()=>alterarRecursosNivel(n)}>
                <strong>{n}</strong><small>{RECURSOS_ROTULOS[n]}</small>
              </button>)}
            </div>
          </div>
          <div className="ro-sheet__collection-header"><h3>Itens Gerais</h3><button type="button" onClick={addItemGeral}><Plus size={17}/> Adicionar item</button></div>
          <div className="ro-sheet__collection">
            {personagem.itensGerais.length===0 && <p className="ro-sheet__empty">Seus itens aparecerão aqui.</p>}
            {personagem.itensGerais.map(item=><div className="ro-sheet__collection-item" key={item.id}>
              <div>
                <label><span>Item / posse</span>
                  <input value={item.nome} onChange={e=>editarItemGeral(item.id,{nome:e.target.value})} placeholder="Nome do item"/></label>
                <label><span>Qtd.</span>
                  <input type="number" min={0} step={1} value={item.quantidade}
                    onChange={e=>{const q=Number(e.target.value); if(Number.isInteger(q)&&q>=0) editarItemGeral(item.id,{quantidade:q});}}/></label>
                <label><span>Observações</span>
                  <input value={item.observacoes} onChange={e=>editarItemGeral(item.id,{observacoes:e.target.value})} placeholder="Observações"/></label>
              </div>
              <button type="button" onClick={()=>removerItemGeral(item.id)} title="Remover item" aria-label={`Remover ${item.nome || 'item'}`}><Trash2 size={17}/></button>
            </div>)}
          </div>
          <label className="ro-sheet__field"><span>Descrição, história e anotações gerais</span>
            <textarea rows={5} value={personagem.anotacoesGerais||''} onChange={e=>salvar({anotacoesGerais:e.target.value})} placeholder="Aparência, comportamento, lembranças e anotações..."/>
          </label>
        </section>
      </div>

      <aside className="ro-sheet__sidebar">
        <div className="ro-sheet__sidebar-card">
          <span className="ro-sheet__eyebrow">VISÃO GERAL</span>
          <img src="/ro-mark.svg" alt="" className="ro-sheet__sidebar-mark"/>
          <h2>{personagem.nome||'Desvelado'}</h2>
          <p>Nível {personagem.nivel} · {personagem.conceito}</p>
          <div className="ro-sheet__sidebar-vitals">
            <div><Heart size={16}/><span>Vida</span><strong>{personagem.vidaAtual}/{personagem.vidaMaxima}</strong></div>
            <div><Flame size={16}/><span>Foco</span><strong>{personagem.focoAtual}/{personagem.focoMaximo}</strong></div>
            <div><Shield size={16}/><span>Proteção Onírica</span><strong>{personagem.protecaoOniricaAtual}/{personagem.protecaoOniricaMaxima}</strong></div>
            <div><Moon size={16}/><span>Ruptura</span><strong>{personagem.ruptura}/6</strong></div>
          </div>
          <button type="button" className="ro-sheet__sidebar-rupture" onClick={()=>setModalRupturaAberto(true)}>Registrar / Histórico de Ruptura <AlertTriangle size={16}/></button>
        </div>
        <div className="ro-sheet__sidebar-card ro-sheet__sidebar-card--anchor"><Anchor size={20}/><h3>Sua Ancoragem</h3><p>{personagem.ancoragem||'O elo com a Realidade ainda não foi registrado.'}</p></div>
        <div className="ro-sheet__sidebar-card ro-sheet__sidebar-card--aside">
          <Archive size={18}/><h3>Registro da ficha</h3>
          <p>As alterações são salvas na ficha. Use as ferramentas de dano, descanso e Ruptura para seus efeitos específicos.</p>
        </div>
      </aside>
    </div>

    <RupturaModal personagem={personagem} isOpen={modalRupturaAberto} onClose={()=>setModalRupturaAberto(false)} onSalvar={onSalvar}/>
    <RestModal personagem={personagem} isOpen={modalDescansoAberto} onClose={()=>setModalDescansoAberto(false)} onSalvar={onSalvar}/>
  </article>;
};
