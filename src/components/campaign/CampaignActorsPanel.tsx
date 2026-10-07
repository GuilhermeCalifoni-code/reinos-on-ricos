import React, { useEffect, useMemo, useState } from 'react';
import { Dice5, ImagePlus, Link2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { Adversario, CategoriaHabilidadeAtor, HabilidadeAtor, NPC, TipoTesteAtor } from '../../types/campaign';
import { AssetImage } from '../system/AssetImage';
import { campaignAssetService } from '../../services/storage/campaignAssetService';

type Mode = 'npc' | 'adversario';

interface CampaignActorsPanelProps {
  mode: Mode;
  campanhaId: string;
  npcs: NPC[];
  adversarios: Adversario[];
  canManage: boolean;
  onAddNpc: (npc: Omit<NPC, 'id'>) => Promise<unknown> | unknown;
  onUpdateNpc: (id: string, patch: Partial<NPC>) => Promise<unknown> | unknown;
  onRemoveNpc: (id: string) => Promise<unknown> | unknown;
  onAddAdversary: (adversario: Omit<Adversario, 'id'>) => Promise<unknown> | unknown;
  onUpdateAdversary: (id: string, patch: Partial<Adversario>) => Promise<unknown> | unknown;
  onRemoveAdversary: (id: string) => Promise<unknown> | unknown;
}

interface RollResult {
  actor: string;
  ability: string;
  kind: TipoTesteAtor;
  die?: number;
  modifier?: number;
  total?: number;
  dt: number;
  atributo?: HabilidadeAtor['atributo'];
}

const uid = () => `hab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(file);
});

const normalizeNpc = (npc: NPC): NPC => ({
  ...npc,
  nivelAmeaca: npc.nivelAmeaca ?? 0,
  vida: npc.vida ?? 1,
  resistencia: npc.resistencia ?? 0,
  dificuldade: npc.dificuldade ?? 10,
  deslocamento: npc.deslocamento || 'Próximo',
  habilidades: npc.habilidades || []
});

const normalizeAdversary = (actor: Adversario): Adversario => ({
  ...actor,
  dificuldade: actor.dificuldade ?? actor.defesa ?? 10,
  deslocamento: actor.deslocamento || 'Próximo',
  habilidades: actor.habilidades?.length
    ? actor.habilidades
    : actor.ataquePrincipal
      ? [{ id: uid(), categoria: 'acao', nome: 'Ação', descricao: actor.ataquePrincipal, teste: 'mundano', dt: actor.dificuldade ?? actor.defesa ?? 10 }]
      : []
});

const AbilityEditor: React.FC<{
  abilities: HabilidadeAtor[];
  onChange: (abilities: HabilidadeAtor[]) => void;
}> = ({ abilities, onChange }) => {
  const update = (id: string, patch: Partial<HabilidadeAtor>) =>
    onChange(abilities.map(item => item.id === id ? { ...item, ...patch } : item));

  return (
    <div className="actor-editor__abilities">
      <div className="actor-editor__section-head">
        <div><p className="ro-eyebrow">Habilidades</p><span>Passivas, ações e reações podem se repetir livremente.</span></div>
        <button type="button" className="ro-button--quiet" onClick={() => onChange([...abilities, { id: uid(), categoria: 'acao', nome: 'Nova ação', descricao: '', teste: 'mundano' }])}>
          <Plus size={14} /> Habilidade
        </button>
      </div>
      {abilities.length === 0 && <p className="actor-editor__empty">Nenhuma habilidade adicionada.</p>}
      {abilities.map(ability => (
        <div key={ability.id} className="actor-editor__ability">
          <div className="actor-editor__ability-grid">
            <select value={ability.categoria} onChange={event => {
              const categoria = event.target.value as CategoriaHabilidadeAtor;
              update(ability.id, { categoria, teste: categoria === 'passiva' ? undefined : ability.teste });
            }}>
              <option value="passiva">Passiva</option>
              <option value="acao">Ação</option>
              <option value="reacao">Reação</option>
            </select>
            <input value={ability.nome} onChange={event => update(ability.id, { nome: event.target.value })} placeholder="Nome" />
            {ability.categoria !== 'passiva' ? (
              <select value={ability.teste || ''} onChange={event => update(ability.id, { teste: (event.target.value || undefined) as TipoTesteAtor | undefined })}>
                <option value="">Sem rolagem</option>
                <option value="mundano">Teste Mundano</option>
                <option value="reflexo">Teste Reflexo</option>
              </select>
            ) : <span className="actor-editor__passive">Sem rolagem</span>}
          </div>
          <textarea rows={2} value={ability.descricao} onChange={event => update(ability.id, { descricao: event.target.value })} placeholder="Descreva o efeito da habilidade." />
          {ability.categoria !== 'passiva' && ability.teste && (
            <div className="actor-editor__roll-config">
              <label>DT <input type="number" min={1} value={ability.dt ?? 10} onChange={event => update(ability.id, { dt: Number(event.target.value) || 10 })} /></label>
              {ability.teste === 'mundano' && <label>Mod. <input type="number" value={ability.modificador ?? 0} onChange={event => update(ability.id, { modificador: Number(event.target.value) || 0 })} /></label>}
              <label>{ability.teste === 'reflexo' ? 'Atributo do alvo' : 'Atributo'}
                <select value={ability.atributo || 'corpo'} onChange={event => update(ability.id, { atributo: event.target.value as HabilidadeAtor['atributo'] })}>
                  <option value="corpo">Corpo</option><option value="mente">Mente</option><option value="vontade">Vontade</option><option value="vinculo">Vínculo</option>
                </select>
              </label>
            </div>
          )}
          <button type="button" className="actor-editor__remove-ability" onClick={() => onChange(abilities.filter(item => item.id !== ability.id))}><Trash2 size={13} /> Remover habilidade</button>
        </div>
      ))}
    </div>
  );
};

export const CampaignActorsPanel: React.FC<CampaignActorsPanelProps> = ({
  mode, campanhaId, npcs, adversarios, canManage,
  onAddNpc, onUpdateNpc, onRemoveNpc, onAddAdversary, onUpdateAdversary, onRemoveAdversary
}) => {
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null);
  const [editingAdv, setEditingAdv] = useState<Adversario | null>(null);
  const [creating, setCreating] = useState(false);
  const [roll, setRoll] = useState<RollResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const actors = mode === 'npc' ? npcs : adversarios;

  const npcDraft = useMemo<NPC>(() => normalizeNpc(editingNpc || {
    id: '', campanhaId, nome: '', papel: 'NPC', conceito: 'Pessoa da Vigília', descricao: '', atitude: 'neutro', localizacao: '',
    nivelAmeaca: 0, vida: 1, resistencia: 0, dificuldade: 10, deslocamento: 'Próximo', habilidades: []
  }), [campanhaId, editingNpc]);
  const advDraft = useMemo<Adversario>(() => normalizeAdversary(editingAdv || {
    id: '', campanhaId, nome: '', tipo: 'pesadelo', nivel: 1, vida: 3, vidaMaxima: 3, defesa: 10, resistencia: 8,
    dificuldade: 14, deslocamento: 'Próximo', habilidades: [], ataquePrincipal: '', descricao: ''
  }), [campanhaId, editingAdv]);

  const [form, setForm] = useState<NPC | Adversario | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetImageDraft = () => {
    setImageFile(null);
    setImageError('');
  };

  const openCreate = () => {
    resetImageDraft();
    setForm(mode === 'npc' ? npcDraft : advDraft);
    setCreating(true);
  };
  const openEditNpc = (npc: NPC) => {
    resetImageDraft();
    setEditingNpc(normalizeNpc(npc));
    setForm(normalizeNpc(npc));
    setCreating(false);
  };
  const openEditAdv = (adv: Adversario) => {
    resetImageDraft();
    setEditingAdv(normalizeAdversary(adv));
    setForm(normalizeAdversary(adv));
    setCreating(false);
  };
  const closeEditor = () => {
    resetImageDraft();
    setForm(null);
    setEditingNpc(null);
    setEditingAdv(null);
    setCreating(false);
  };

  const selectImage = (file?: File) => {
    setImageError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Selecione uma imagem PNG, JPG, WEBP ou GIF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setImageError('A imagem excede o limite de 15 MB.');
      return;
    }
    setImageFile(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form?.nome.trim() || busy) return;
    setBusy(true);
    try {
      let imageValue = form.imagemUrl;
      if (imageFile) {
        if (campaignAssetService.isRemoteCampaignId(campanhaId)) {
          const path = await campaignAssetService.uploadActorPortrait(
            campanhaId,
            mode === 'npc' ? 'npcs' : 'adversaries',
            imageFile
          );
          imageValue = campaignAssetService.toStorageRef(path);
        } else {
          imageValue = await fileToDataUrl(imageFile);
        }
      }

      if (mode === 'npc') {
        const item = normalizeNpc({ ...(form as NPC), imagemUrl: imageValue });
        if (creating) {
          const { id: _, ...draft } = item;
          await onAddNpc(draft);
        } else await onUpdateNpc(item.id, item);
      } else {
        const item = normalizeAdversary({ ...(form as Adversario), imagemUrl: imageValue });
        item.ataquePrincipal = item.habilidades?.find(h => h.categoria === 'acao')?.descricao || item.ataquePrincipal || '';
        if (creating) {
          const { id: _, ...draft } = item;
          await onAddAdversary(draft);
        } else await onUpdateAdversary(item.id, item);
      }
      closeEditor();
    } finally { setBusy(false); }
  };

  const rollAbility = (actorName: string, ability: HabilidadeAtor, fallbackDt: number) => {
    if (!ability.teste || ability.categoria === 'passiva') return;
    const dt = ability.dt || fallbackDt;

    if (ability.teste === 'reflexo') {
      setRoll({ actor: actorName, ability: ability.nome, kind: 'reflexo', dt, atributo: ability.atributo || 'corpo' });
      return;
    }

    const die = Math.floor(Math.random() * 20) + 1;
    const modifier = ability.modificador || 0;
    setRoll({ actor: actorName, ability: ability.nome, kind: 'mundano', die, modifier, total: die + modifier, dt, atributo: ability.atributo });
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    if (mode === 'npc') await onRemoveNpc(id); else await onRemoveAdversary(id);
  };

  return (
    <section className="actor-library">
      <header className="actor-library__head">
        <div>
          <p className="ro-eyebrow">{mode === 'npc' ? 'Vigília' : 'Ameaças'}</p>
          <h2>{mode === 'npc' ? 'Personagens Não-Jogadores' : 'Adversários'}</h2>
          <p>{mode === 'npc' ? 'Fichas simples para aliados, contatos, suspeitos e pessoas comuns.' : 'NA, dificuldade, vida, resistência e habilidades no formato do Livro de Adversários.'}</p>
        </div>
        {canManage && <button className="ro-button" onClick={openCreate}><Plus size={14} /> {mode === 'npc' ? 'Novo NPC' : 'Novo adversário'}</button>}
      </header>

      <div className="actor-library__grid">
        {actors.map(raw => {
          const npc = mode === 'npc' ? normalizeNpc(raw as NPC) : null;
          const adv = mode === 'adversario' ? normalizeAdversary(raw as Adversario) : null;
          const name = npc?.nome || adv!.nome;
          const abilities = npc?.habilidades || adv?.habilidades || [];
          const difficulty = npc?.dificuldade ?? adv?.dificuldade ?? 10;
          return (
            <article key={raw.id} className="actor-card">
              <div className="actor-card__top">
                <div className={`actor-card__portrait ${raw.imagemUrl ? 'has-image' : ''}`}>
                  {raw.imagemUrl
                    ? <AssetImage src={raw.imagemUrl} alt={`Retrato de ${name}`} />
                    : <span>{name.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div><p className="ro-eyebrow">{mode === 'npc' ? npc!.papel : adv!.tipo}</p><h3>{name}</h3><small className="actor-card__visibility">{raw.visibilidade === 'revelado_jogadores' ? 'Revelado' : raw.visibilidade === 'compartilhado' ? 'Compartilhado' : 'Mestre privado'}</small></div>
                {canManage && <div className="actor-card__tools">
                  <button onClick={() => mode === 'npc' ? openEditNpc(npc!) : openEditAdv(adv!)} title="Editar"><Pencil size={14} /></button>
                  <button onClick={() => void remove(raw.id, name)} title="Excluir" className="is-danger"><Trash2 size={14} /></button>
                </div>}
              </div>

              <dl className="actor-card__stats">
                <div><dt>NA</dt><dd>{npc?.nivelAmeaca ?? adv!.nivel}</dd></div>
                <div><dt>PV</dt><dd>{npc?.vida ?? adv!.vida}{adv ? `/${adv.vidaMaxima}` : ''}</dd></div>
                <div><dt>R</dt><dd>{npc?.resistencia ?? adv!.resistencia}</dd></div>
                <div><dt>Dif</dt><dd>{difficulty}</dd></div>
                <div><dt>Desl</dt><dd>{npc?.deslocamento || adv?.deslocamento || 'Próximo'}</dd></div>
              </dl>

              {(npc?.descricao || adv?.descricao) && <p className="actor-card__description">{npc?.descricao || adv?.descricao}</p>}
              {abilities.length > 0 && <div className="actor-card__abilities">
                {(['passiva','acao','reacao'] as CategoriaHabilidadeAtor[]).map(category => abilities.filter(a => a.categoria === category).map(ability => (
                  <div key={ability.id} className="actor-card__ability">
                    <div className="actor-card__ability-title"><span>{category === 'acao' ? 'Ação' : category === 'reacao' ? 'Reação' : 'Passiva'}</span><strong>{ability.nome}</strong>
                      {ability.teste && category !== 'passiva' && <button onClick={() => rollAbility(name, ability, difficulty)}><Dice5 size={13} /> {ability.teste === 'reflexo' ? 'Solicitar Reflexo' : 'Rolar Mundano'}</button>}
                    </div>
                    <p>{ability.descricao}</p>
                  </div>
                )))}
              </div>}
            </article>
          );
        })}
        {actors.length === 0 && <div className="ro-empty-state actor-library__empty"><p className="ro-eyebrow">Arquivo vazio</p><h3>{mode === 'npc' ? 'Nenhum NPC registrado.' : 'Nenhum adversário registrado.'}</h3>{canManage && <button className="ro-button mt-4" onClick={openCreate}>Criar primeiro registro</button>}</div>}
      </div>

      {form && <div className="actor-editor__backdrop" onMouseDown={closeEditor}>
        <form className="actor-editor" onSubmit={save} onMouseDown={event => event.stopPropagation()}>
          <header><div><p className="ro-eyebrow">{creating ? 'Novo registro' : 'Editar ficha'}</p><h2>{mode === 'npc' ? 'NPC' : 'Adversário'}</h2></div><button type="button" onClick={closeEditor}><X size={18} /></button></header>
          <div className="actor-editor__body">
            <div className="actor-editor__image actor-editor__wide">
              <div className="actor-editor__image-preview">
                {imagePreview || form.imagemUrl
                  ? <AssetImage src={imagePreview || form.imagemUrl} alt="Prévia do retrato" />
                  : <ImagePlus size={28} />}
              </div>
              <div className="actor-editor__image-fields">
                <div>
                  <p className="ro-eyebrow">Retrato da ficha</p>
                  <span>A imagem aparece no arquivo da campanha e pode virar token na Mesa Ao Vivo.</span>
                </div>
                <label className="actor-editor__image-upload">
                  <Upload size={14} />
                  <span>{imageFile ? imageFile.name : 'Enviar imagem'}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => selectImage(event.target.files?.[0])} />
                </label>
                <label className="actor-editor__image-url">
                  <Link2 size={13} />
                  <input
                    type="url"
                    value={imageFile ? '' : (form.imagemUrl || '')}
                    disabled={Boolean(imageFile)}
                    onChange={event => setForm({ ...form, imagemUrl: event.target.value || undefined } as NPC | Adversario)}
                    placeholder="ou cole a URL da imagem"
                  />
                </label>
                {(imageFile || form.imagemUrl) && (
                  <button type="button" className="ro-button--quiet" onClick={() => {
                    setImageFile(null);
                    setForm({ ...form, imagemUrl: undefined } as NPC | Adversario);
                  }}>
                    Remover imagem
                  </button>
                )}
                {imageError && <small className="actor-editor__image-error">{imageError}</small>}
              </div>
            </div>
            <label className="actor-editor__wide">Nome<input value={form.nome} onChange={event => setForm({ ...form, nome: event.target.value })} required /></label>
            {mode === 'npc' ? <>
              <label>Papel<input value={(form as NPC).papel} onChange={event => setForm({ ...form, papel: event.target.value } as NPC)} /></label>
              <label>Localização<input value={(form as NPC).localizacao} onChange={event => setForm({ ...form, localizacao: event.target.value } as NPC)} /></label>
              <label>NA<input type="number" min={0} value={(form as NPC).nivelAmeaca ?? 0} onChange={event => setForm({ ...form, nivelAmeaca: Number(event.target.value) } as NPC)} /></label>
              <label>PV<input type="number" min={0} value={(form as NPC).vida ?? 1} onChange={event => setForm({ ...form, vida: Number(event.target.value) } as NPC)} /></label>
              <label>R<input type="number" min={0} value={(form as NPC).resistencia ?? 0} onChange={event => setForm({ ...form, resistencia: Number(event.target.value) } as NPC)} /></label>
              <label>Dif<input type="number" min={1} value={(form as NPC).dificuldade ?? 10} onChange={event => setForm({ ...form, dificuldade: Number(event.target.value) } as NPC)} /></label>
              <label>Deslocamento<input value={(form as NPC).deslocamento || 'Próximo'} onChange={event => setForm({ ...form, deslocamento: event.target.value } as NPC)} /></label>
              <label>Atitude<select value={(form as NPC).atitude} onChange={event => setForm({ ...form, atitude: event.target.value as NPC['atitude'] } as NPC)}><option value="aliado">Aliado</option><option value="neutro">Neutro</option><option value="hostil">Hostil</option><option value="desconhecido">Desconhecido</option></select></label>
            </> : <>
              <label>Tipo<select value={(form as Adversario).tipo} onChange={event => setForm({ ...form, tipo: event.target.value as Adversario['tipo'] } as Adversario)}><option value="humano">Humano</option><option value="pesadelo">Pesadelo</option><option value="aberracao">Aberração</option><option value="sombra">Sombra</option></select></label>
              <label>NA<input type="number" min={1} max={5} value={(form as Adversario).nivel} onChange={event => setForm({ ...form, nivel: Number(event.target.value) } as Adversario)} /></label>
              <label>PV atual<input type="number" min={0} value={(form as Adversario).vida} onChange={event => setForm({ ...form, vida: Number(event.target.value) } as Adversario)} /></label>
              <label>PV máximo<input type="number" min={1} value={(form as Adversario).vidaMaxima} onChange={event => setForm({ ...form, vidaMaxima: Number(event.target.value) } as Adversario)} /></label>
              <label>R<input type="number" min={0} value={(form as Adversario).resistencia} onChange={event => setForm({ ...form, resistencia: Number(event.target.value) } as Adversario)} /></label>
              <label>Dif<input type="number" min={1} value={(form as Adversario).dificuldade ?? 10} onChange={event => setForm({ ...form, dificuldade: Number(event.target.value) } as Adversario)} /></label>
              <label>Deslocamento<input value={(form as Adversario).deslocamento || 'Próximo'} onChange={event => setForm({ ...form, deslocamento: event.target.value } as Adversario)} /></label>
            </>}
            <label>Visibilidade
              <select value={form.visibilidade || 'mestre_privado'} onChange={event => setForm({ ...form, visibilidade: event.target.value as NPC['visibilidade'] } as NPC | Adversario)}>
                <option value="mestre_privado">Mestre privado</option>
                <option value="compartilhado">Compartilhado</option>
                <option value="revelado_jogadores">Revelado aos jogadores</option>
              </select>
            </label>
            <label className="actor-editor__wide">Descrição<textarea rows={3} value={form.descricao} onChange={event => setForm({ ...form, descricao: event.target.value } as NPC | Adversario)} /></label>
            <div className="actor-editor__wide"><AbilityEditor abilities={form.habilidades || []} onChange={habilidades => setForm({ ...form, habilidades } as NPC | Adversario)} /></div>
          </div>
          <footer><button type="button" className="ro-button--quiet" onClick={closeEditor}>Cancelar</button><button className="ro-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar ficha'}</button></footer>
        </form>
      </div>}

      {roll && <div className="actor-roll__backdrop" onMouseDown={() => setRoll(null)}>
        <div className="actor-roll" onMouseDown={event => event.stopPropagation()}>
          <p className="ro-eyebrow">{roll.kind === 'reflexo' ? 'Teste Reflexo' : 'Teste Mundano'}</p>
          <h3>{roll.actor} · {roll.ability}</h3>
          {roll.kind === 'reflexo' ? (
            <div className="actor-roll__request">
              <strong>O alvo realiza o teste.</strong>
              <p>Role 1d20 + {roll.atributo === 'vinculo' ? 'Vínculo' : roll.atributo === 'vontade' ? 'Vontade' : roll.atributo === 'mente' ? 'Mente' : 'Corpo'} contra DT {roll.dt}.</p>
              <small>Teste Reflexo é um Teste Mundano de reação. O modificador pertence ao alvo, não ao NPC ou Adversário.</small>
            </div>
          ) : (
            <>
              <div className="actor-roll__result"><strong>{roll.die}</strong><span>{(roll.modifier || 0) >= 0 ? '+' : '−'} {Math.abs(roll.modifier || 0)}</span><b>= {roll.total}</b></div>
              <p>DT {roll.dt} · <strong className={(roll.total || 0) >= roll.dt ? 'is-success' : 'is-failure'}>{(roll.total || 0) >= roll.dt ? 'SUCESSO' : 'FRACASSO'}</strong></p>
            </>
          )}
          <button className="ro-button" onClick={() => setRoll(null)}>Fechar</button>
        </div>
      </div>}
    </section>
  );
};
