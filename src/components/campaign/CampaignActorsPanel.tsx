import React, { useMemo, useState } from 'react';
import { Adversario, HabilidadeAtor, NPC, TesteVinculado, TipoHabilidadeAtor } from '../../types/campaign';
import { AtributoNome, Personagem, ResultadoTesteMundano } from '../../types/character';
import { executarTesteMundano } from '../../rules/rulesEngine';

type Mode = 'npcs' | 'adversarios';

interface CampaignActorsPanelProps {
  mode: Mode;
  campaignId: string;
  npcs: NPC[];
  adversarios: Adversario[];
  personagens: Personagem[];
  canManage: boolean;
  onAddNpc: (item: Omit<NPC, 'id'>) => Promise<unknown> | unknown;
  onUpdateNpc: (id: string, patch: Partial<NPC>) => Promise<unknown> | unknown;
  onRemoveNpc: (id: string) => Promise<unknown> | unknown;
  onAddAdversary: (item: Omit<Adversario, 'id'>) => Promise<unknown> | unknown;
  onUpdateAdversary: (id: string, patch: Partial<Adversario>) => Promise<unknown> | unknown;
  onRemoveAdversary: (id: string) => Promise<unknown> | unknown;
}

type ActorEditor =
  | { kind: 'npc'; value?: NPC }
  | { kind: 'adversario'; value?: Adversario }
  | null;

interface RollRequest {
  actorName: string;
  ability: HabilidadeAtor;
  test: TesteVinculado;
}

const makeAbility = (): HabilidadeAtor => ({
  id: `hab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  tipo: 'acao',
  nome: '',
  descricao: ''
});

const StatStrip: React.FC<{ items: Array<[string, React.ReactNode]> }> = ({ items }) => (
  <dl className="actor-sheet__stats">
    {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
  </dl>
);

const AbilityList: React.FC<{ abilities: HabilidadeAtor[]; onRoll: (ability: HabilidadeAtor) => void }> = ({ abilities, onRoll }) => (
  <div className="actor-sheet__abilities">
    {abilities.length === 0 && <p className="actor-sheet__empty">Nenhuma habilidade registrada.</p>}
    {abilities.map(ability => (
      <article key={ability.id} className="actor-sheet__ability">
        <div className="actor-sheet__ability-head">
          <span className={`is-${ability.tipo}`}>{ability.tipo === 'acao' ? 'Ação' : ability.tipo === 'reacao' ? 'Reação' : 'Passiva'}</span>
          {ability.teste && ability.tipo !== 'passiva' && (
            <button type="button" onClick={() => onRoll(ability)}>
              {ability.teste.tipo === 'reflexo' ? 'Teste Reflexo' : 'Teste Mundano'} · {ability.teste.atributo} DT {ability.teste.dt}
            </button>
          )}
        </div>
        <p><strong>{ability.nome || 'Sem nome'}.</strong> {ability.descricao}</p>
      </article>
    ))}
  </div>
);

const AbilityEditor: React.FC<{ abilities: HabilidadeAtor[]; onChange: (items: HabilidadeAtor[]) => void }> = ({ abilities, onChange }) => {
  const patch = (id: string, partial: Partial<HabilidadeAtor>) => onChange(abilities.map(item => item.id === id ? { ...item, ...partial } : item));
  const setTestType = (ability: HabilidadeAtor, value: '' | 'mundano' | 'reflexo') => {
    if (!value || ability.tipo === 'passiva') return patch(ability.id, { teste: undefined });
    patch(ability.id, { teste: { tipo: value, atributo: ability.teste?.atributo || 'corpo', dt: ability.teste?.dt || 12 } });
  };
  return (
    <div className="actor-editor__abilities">
      <div className="actor-editor__section-head">
        <div><span>Habilidades</span><small>Passivas não recebem botão de rolagem.</small></div>
        <button type="button" onClick={() => onChange([...abilities, makeAbility()])}>+ Habilidade</button>
      </div>
      {abilities.map((ability, index) => (
        <div key={ability.id} className="actor-editor__ability">
          <div className="actor-editor__row">
            <select value={ability.tipo} onChange={event => {
              const tipo = event.target.value as TipoHabilidadeAtor;
              patch(ability.id, { tipo, teste: tipo === 'passiva' ? undefined : ability.teste });
            }}>
              <option value="passiva">Passiva</option>
              <option value="acao">Ação</option>
              <option value="reacao">Reação</option>
            </select>
            <input value={ability.nome} onChange={event => patch(ability.id, { nome: event.target.value })} placeholder={`Nome da habilidade ${index + 1}`} />
            <button type="button" className="is-danger" onClick={() => onChange(abilities.filter(item => item.id !== ability.id))}>Remover</button>
          </div>
          <textarea rows={2} value={ability.descricao} onChange={event => patch(ability.id, { descricao: event.target.value })} placeholder="Descrição da habilidade, alcance, dano, condição..." />
          {ability.tipo !== 'passiva' && (
            <div className="actor-editor__test">
              <select value={ability.teste?.tipo || ''} onChange={event => setTestType(ability, event.target.value as '' | 'mundano' | 'reflexo')}>
                <option value="">Sem teste vinculado</option>
                <option value="mundano">Teste Mundano</option>
                <option value="reflexo">Teste Reflexo</option>
              </select>
              {ability.teste && <>
                <select value={ability.teste.atributo} onChange={event => patch(ability.id, { teste: { ...ability.teste!, atributo: event.target.value as AtributoNome } })}>
                  <option value="corpo">Corpo</option><option value="mente">Mente</option><option value="vontade">Vontade</option><option value="vinculo">Vínculo</option>
                </select>
                <label>DT <input type="number" min={1} max={40} value={ability.teste.dt} onChange={event => patch(ability.id, { teste: { ...ability.teste!, dt: Number(event.target.value) || 1 } })} /></label>
              </>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const CampaignActorsPanel: React.FC<CampaignActorsPanelProps> = ({
  mode, campaignId, npcs, adversarios, personagens, canManage,
  onAddNpc, onUpdateNpc, onRemoveNpc, onAddAdversary, onUpdateAdversary, onRemoveAdversary
}) => {
  const [editor, setEditor] = useState<ActorEditor>(null);
  const [roll, setRoll] = useState<RollRequest | null>(null);
  const [targetId, setTargetId] = useState('');
  const [rollResult, setRollResult] = useState<ResultadoTesteMundano | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [papel, setPapel] = useState('');
  const [localizacao, setLocalizacao] = useState('São Paulo');
  const [atitude, setAtitude] = useState<NPC['atitude']>('neutro');
  const [na, setNa] = useState(0);
  const [pv, setPv] = useState(1);
  const [r, setR] = useState(0);
  const [dif, setDif] = useState(10);
  const [desl, setDesl] = useState('Próximo');
  const [origem, setOrigem] = useState('');
  const [natureza, setNatureza] = useState('Pesadelo Emocional');
  const [perturbacao, setPerturbacao] = useState('');
  const [tipoAdv, setTipoAdv] = useState<Adversario['tipo']>('pesadelo');
  const [habilidades, setHabilidades] = useState<HabilidadeAtor[]>([]);

  const resetEditor = () => {
    setEditor(null); setNome(''); setDescricao(''); setPapel(''); setLocalizacao('São Paulo'); setAtitude('neutro');
    setNa(mode === 'npcs' ? 0 : 1); setPv(mode === 'npcs' ? 1 : 3); setR(mode === 'npcs' ? 0 : 8); setDif(mode === 'npcs' ? 10 : 14);
    setDesl('Próximo'); setOrigem(''); setNatureza('Pesadelo Emocional'); setPerturbacao(''); setTipoAdv('pesadelo'); setHabilidades([]);
  };

  const openNpc = (npc?: NPC) => {
    setEditor({ kind: 'npc', value: npc });
    setNome(npc?.nome || ''); setDescricao(npc?.descricao || ''); setPapel(npc?.papel || 'NPC'); setLocalizacao(npc?.localizacao || 'São Paulo');
    setAtitude(npc?.atitude || 'neutro'); setNa(npc?.nivelAmeaca ?? 0); setPv(npc?.vida ?? 1); setR(npc?.resistencia ?? 0);
    setDif(npc?.dificuldade ?? 10); setDesl(npc?.deslocamento || 'Próximo'); setHabilidades(npc?.habilidades || []);
  };

  const openAdversary = (adv?: Adversario) => {
    setEditor({ kind: 'adversario', value: adv });
    setNome(adv?.nome || ''); setDescricao(adv?.descricao || ''); setNa(adv?.nivel ?? 1); setPv(adv?.vidaMaxima ?? 3); setR(adv?.resistencia ?? 8);
    setDif(adv?.defesa ?? 14); setDesl(adv?.deslocamento || 'Próximo'); setOrigem(adv?.origem || ''); setNatureza(adv?.natureza || 'Pesadelo Emocional');
    setPerturbacao(adv?.perturbacao || ''); setTipoAdv(adv?.tipo || 'pesadelo'); setHabilidades(adv?.habilidades || []);
  };

  const startRoll = (actorName: string, ability: HabilidadeAtor) => {
    if (!ability.teste) return;
    setRoll({ actorName, ability, test: ability.teste }); setTargetId(personagens[0]?.id || ''); setRollResult(null);
  };

  const executeRoll = () => {
    if (!roll) return;
    const target = personagens.find(item => item.id === targetId);
    const valorAtributo = target?.atributos[roll.test.atributo] || 0;
    setRollResult(executarTesteMundano({
      atributo: roll.test.atributo,
      valorAtributo,
      dt: roll.test.dt,
      modificadores: [],
      modoRolagem: 'normal',
      usarFoco: false
    }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || !nome.trim() || busy) return;
    setBusy(true); setMessage('');
    try {
      if (editor.kind === 'npc') {
        const item: Omit<NPC, 'id'> = {
          campanhaId: campaignId, nome: nome.trim(), papel: papel.trim() || 'NPC', conceito: papel.trim() || 'Habitante da Vigília',
          descricao: descricao.trim(), atitude, localizacao: localizacao.trim() || 'São Paulo', nivelAmeaca: Math.max(0, na),
          vida: Math.max(0, pv), resistencia: r, dificuldade: Math.max(0, dif), deslocamento: desl.trim() || 'Próximo',
          habilidades, visibilidade: 'mestre_privado'
        };
        if (editor.value) await onUpdateNpc(editor.value.id, item); else await onAddNpc(item);
      } else {
        const legacyAttack = habilidades.find(item => item.tipo === 'acao')?.descricao || '';
        const item: Omit<Adversario, 'id'> = {
          campanhaId: campaignId, nome: nome.trim(), tipo: tipoAdv, nivel: Math.max(1, Math.min(5, na || 1)),
          vida: Math.max(0, Math.min(pv, editor.value?.vida ?? pv)), vidaMaxima: Math.max(1, pv), defesa: Math.max(0, dif),
          resistencia: r, ataquePrincipal: legacyAttack, descricao: descricao.trim(), origem: origem.trim() || undefined,
          natureza: natureza.trim() || undefined, perturbacao: perturbacao.trim() || undefined, deslocamento: desl.trim() || 'Próximo',
          habilidades, visibilidade: 'mestre_privado'
        };
        if (editor.value) await onUpdateAdversary(editor.value.id, item); else await onAddAdversary(item);
      }
      resetEditor();
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível salvar a ficha.');
    } finally { setBusy(false); }
  };

  const confirmRemove = async (kind: Mode, id: string, actorName: string) => {
    if (!window.confirm(`Excluir "${actorName}"? Essa ação remove a ficha da campanha.`)) return;
    try { kind === 'npcs' ? await onRemoveNpc(id) : await onRemoveAdversary(id); }
    catch (error: any) { setMessage(error.message || 'Não foi possível excluir a ficha.'); }
  };

  const title = mode === 'npcs' ? 'Personagens Não-Jogadores' : 'Adversários';
  const subtitle = mode === 'npcs'
    ? 'Fichas rápidas da Vigília, no mesmo formato do Livro Básico.'
    : 'Pesadelos e ameaças na estrutura do Livro de Adversários.';

  return (
    <section className="actor-library">
      <header className="actor-library__head">
        <div><p className="ro-eyebrow">{mode === 'npcs' ? 'Vigília' : 'Sonhar hostil'}</p><h2>{title}</h2><p>{subtitle}</p></div>
        {canManage && <button className="ro-button" onClick={() => mode === 'npcs' ? openNpc() : openAdversary()}>+ {mode === 'npcs' ? 'Novo NPC' : 'Novo adversário'}</button>}
      </header>

      <div className="actor-library__grid">
        {mode === 'npcs' ? npcs.map(npc => (
          <article className="actor-sheet" key={npc.id}>
            <header><div><small>{npc.papel || 'NPC'}</small><h3>{npc.nome}</h3></div><span>{npc.atitude}</span></header>
            <StatStrip items={[[ 'NA', npc.nivelAmeaca ?? 0 ], [ 'PV', npc.vida ?? 1 ], [ 'R', npc.resistencia ?? 0 ], [ 'Dif', npc.dificuldade ?? 10 ], [ 'Desl', npc.deslocamento || 'Próximo' ]]} />
            {npc.descricao && <p className="actor-sheet__description">{npc.descricao}</p>}
            <AbilityList abilities={npc.habilidades || []} onRoll={ability => startRoll(npc.nome, ability)} />
            {canManage && <footer><button onClick={() => openNpc(npc)}>Editar</button><button className="is-danger" onClick={() => void confirmRemove('npcs', npc.id, npc.nome)}>Excluir</button></footer>}
          </article>
        )) : adversarios.map(adv => (
          <article className="actor-sheet actor-sheet--adversary" key={adv.id}>
            <header><div><small>{adv.origem ? `Origem: ${adv.origem}` : adv.tipo}</small><h3>{adv.nome}</h3>{adv.natureza && <p>{adv.natureza}</p>}</div><span>NA {adv.nivel}</span></header>
            {adv.descricao && <p className="actor-sheet__description">{adv.descricao}</p>}
            {adv.perturbacao && <p className="actor-sheet__disturbance"><strong>Perturbação:</strong> {adv.perturbacao}</p>}
            <StatStrip items={[[ 'NA', adv.nivel ], [ 'Dif', adv.defesa ], [ 'PV', adv.vidaMaxima ], [ 'R', adv.resistencia ], [ 'Desl', adv.deslocamento || 'Próximo' ]]} />
            <AbilityList abilities={(adv.habilidades && adv.habilidades.length ? adv.habilidades : adv.ataquePrincipal ? [{ id: `legacy-${adv.id}`, tipo: 'acao', nome: 'Ataque principal', descricao: adv.ataquePrincipal }] : [])} onRoll={ability => startRoll(adv.nome, ability)} />
            {canManage && <footer><button onClick={() => openAdversary(adv)}>Editar</button><button className="is-danger" onClick={() => void confirmRemove('adversarios', adv.id, adv.nome)}>Excluir</button></footer>}
          </article>
        ))}
        {(mode === 'npcs' ? npcs.length === 0 : adversarios.length === 0) && <div className="ro-empty-state actor-library__empty"><p className="ro-eyebrow">Arquivo vazio</p><h3>Nenhuma ficha registrada.</h3><p>Adicione a primeira ficha para deixá-la pronta durante a sessão.</p></div>}
      </div>

      {message && <p className="actor-library__message">{message}</p>}

      {editor && <div className="actor-modal" role="dialog" aria-modal="true">
        <form className="actor-editor" onSubmit={save}>
          <header><div><p className="ro-eyebrow">{editor.value ? 'Editar ficha' : 'Nova ficha'}</p><h2>{editor.kind === 'npc' ? 'NPC' : 'Adversário'}</h2></div><button type="button" aria-label="Fechar" onClick={resetEditor}>×</button></header>
          <div className="actor-editor__fields">
            <label className="is-wide"><span>Nome</span><input required value={nome} onChange={e => setNome(e.target.value)} /></label>
            {editor.kind === 'npc' ? <>
              <label><span>Papel</span><input value={papel} onChange={e => setPapel(e.target.value)} placeholder="Policial de Rua" /></label>
              <label><span>Localização</span><input value={localizacao} onChange={e => setLocalizacao(e.target.value)} /></label>
              <label><span>Atitude</span><select value={atitude} onChange={e => setAtitude(e.target.value as NPC['atitude'])}><option value="aliado">Aliado</option><option value="neutro">Neutro</option><option value="hostil">Hostil</option><option value="desconhecido">Desconhecido</option></select></label>
            </> : <>
              <label><span>Origem</span><input value={origem} onChange={e => setOrigem(e.target.value)} placeholder="Fonte / Cicatriz" /></label>
              <label><span>Natureza</span><input value={natureza} onChange={e => setNatureza(e.target.value)} placeholder="Pesadelo Emocional" /></label>
              <label><span>Tipo interno</span><select value={tipoAdv} onChange={e => setTipoAdv(e.target.value as Adversario['tipo'])}><option value="pesadelo">Pesadelo</option><option value="aberracao">Aberração</option><option value="sombra">Sombra</option><option value="humano">Humano</option></select></label>
            </>}
            <label><span>NA</span><input type="number" min={0} max={5} value={na} onChange={e => setNa(Number(e.target.value))} /></label>
            <label><span>PV</span><input type="number" min={0} value={pv} onChange={e => setPv(Number(e.target.value))} /></label>
            <label><span>R</span><input type="number" value={r} onChange={e => setR(Number(e.target.value))} /></label>
            <label><span>Dif</span><input type="number" min={0} value={dif} onChange={e => setDif(Number(e.target.value))} /></label>
            <label><span>Desl</span><input value={desl} onChange={e => setDesl(e.target.value)} placeholder="Próximo" /></label>
            <label className="is-wide"><span>Descrição</span><textarea rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} /></label>
            {editor.kind === 'adversario' && <label className="is-wide"><span>Perturbação</span><textarea rows={3} value={perturbacao} onChange={e => setPerturbacao(e.target.value)} /></label>}
          </div>
          <AbilityEditor abilities={habilidades} onChange={setHabilidades} />
          <footer><button type="button" className="ro-button--quiet" onClick={resetEditor}>Cancelar</button><button className="ro-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar ficha'}</button></footer>
        </form>
      </div>}

      {roll && <div className="actor-modal" role="dialog" aria-modal="true">
        <section className="actor-roll">
          <header><div><p className="ro-eyebrow">{roll.test.tipo === 'reflexo' ? 'Teste Reflexo' : 'Teste Mundano'}</p><h2>{roll.ability.nome}</h2><p>{roll.actorName} exige {roll.test.atributo} contra DT {roll.test.dt}.</p></div><button type="button" onClick={() => setRoll(null)}>×</button></header>
          <label><span>Quem realiza o teste?</span><select value={targetId} onChange={e => { setTargetId(e.target.value); setRollResult(null); }}><option value="">Mesa / sem modificador</option>{personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
          <button className="ro-button" onClick={executeRoll}>Rolar {roll.test.tipo === 'reflexo' ? 'Reflexo' : 'Teste'}</button>
          {rollResult && <div className={`actor-roll__result ${rollResult.sucesso ? 'is-success' : 'is-failure'}`}><span>d20 {rollResult.dadoBruto} + {rollResult.valorAtributo}</span><strong>{rollResult.totalFinal}</strong><small>vs DT {rollResult.dt} · {rollResult.sucesso ? 'Sucesso' : 'Fracasso'}</small></div>}
        </section>
      </div>}
    </section>
  );
};
