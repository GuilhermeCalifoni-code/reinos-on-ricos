import React, { useMemo, useState } from 'react';
import { Check, Copy, Link2, RefreshCw, UserRound } from 'lucide-react';
import { MembroCampanha } from '../../types/campaign';
import { Personagem } from '../../types/character';
import { AssetImage } from '../system/AssetImage';

interface CampaignMembersPanelProps {
  campaignId: string;
  members: MembroCampanha[];
  inviteCode: string;
  currentUserId?: string;
  characters: Personagem[];
  personalCharacters?: Personagem[];
  canManage: boolean;
  onRegenerateInvite?: (campaignId: string) => Promise<string>;
  onUpdateMember?: (campaignId: string, userId: string, patch: { role?: MembroCampanha['role']; status?: MembroCampanha['status']; characterId?: string | null }) => Promise<void>;
  onLinkOwnCharacter?: (campaignId: string, characterId: string | null) => Promise<void>;
  onAssignPreparedCharacter?: (campaignId: string, playerEmail: string, characterId: string) => Promise<void>;
  onManagePreparedCharacter?: (campaignId: string, characterId: string, attach: boolean) => Promise<void>;
}

export const CampaignMembersPanel: React.FC<CampaignMembersPanelProps> = ({
  campaignId,
  members,
  inviteCode,
  currentUserId,
  characters,
  personalCharacters = [],
  canManage,
  onRegenerateInvite,
  onUpdateMember,
  onLinkOwnCharacter,
  onAssignPreparedCharacter,
  onManagePreparedCharacter
}) => {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [preparedCharacterId, setPreparedCharacterId] = useState('');
  const [rosterChoice, setRosterChoice] = useState('');
  const [preparedPlayerEmail, setPreparedPlayerEmail] = useState('');
  const currentMember = members.find(member => member.userId === currentUserId);
  const linkedCharacter = characters.find(character => character.id === currentMember?.characterId);

  const ownChoices = useMemo(
    () => personalCharacters.filter(character =>
      character.ownerUserId === currentUserId
      && (!character.campaignId || character.campaignId === campaignId)
    ),
    [campaignId, currentUserId, personalCharacters]
  );

  const availablePrepared = useMemo(() => personalCharacters.filter(character =>
    character.ownerUserId === currentUserId
    && (!character.campaignId || character.campaignId === campaignId)
    && !members.some(member => member.characterId === character.id && member.userId !== currentUserId)
  ), [personalCharacters, currentUserId, campaignId, members]);

  const freeCharacters = personalCharacters.filter(character =>
    character.ownerUserId === currentUserId && !character.campaignId
  );
  const stagedCharacters = personalCharacters.filter(character =>
    character.ownerUserId === currentUserId && character.campaignId === campaignId
  );

  const managePrepared = async (characterId: string, attach: boolean) => {
    if (!onManagePreparedCharacter || busy) return;
    setBusy('manage-roster');
    setMessage('');
    try {
      await onManagePreparedCharacter(campaignId, characterId, attach);
      if (attach) setRosterChoice('');
      setMessage(attach
        ? 'Ficha adicionada ao elenco. Você pode preparar outras fichas sem associá-las à sua conta como jogador.'
        : 'Ficha retirada do elenco e mantida na sua biblioteca pessoal.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o elenco.');
    } finally { setBusy(''); }
  };

  const assignPrepared = async () => {
    const character = availablePrepared.find(item => item.id === preparedCharacterId);
    const email = preparedPlayerEmail.trim().toLowerCase();
    if (!onAssignPreparedCharacter || !character || busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const confirmed = window.confirm(
      `Entregar definitivamente a ficha "${character.nome}" para a conta ${email}? A ficha passará a pertencer ao jogador e não será apagada nenhuma ficha anterior.`
    );
    if (!confirmed) return;
    setBusy('prepared-character');
    setMessage('');
    try {
      await onAssignPreparedCharacter(campaignId, email, character.id);
      setPreparedCharacterId('');
      setPreparedPlayerEmail('');
      setMessage(`Ficha "${character.nome}" entregue ao e-mail informado. O jogador pode reabrir a Mesa para acessá-la.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível entregar a ficha.');
    } finally {
      setBusy('');
    }
  };

  const regenerate = async () => {
    if (!onRegenerateInvite) return;
    setBusy('invite');
    setMessage('');
    try {
      const code = await onRegenerateInvite(campaignId);
      await navigator.clipboard?.writeText(code);
      setMessage('Novo código gerado e copiado.');
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível regenerar o código.');
    } finally {
      setBusy('');
    }
  };

  const update = async (
    member: MembroCampanha,
    patch: Parameters<NonNullable<typeof onUpdateMember>>[2]
  ) => {
    if (!onUpdateMember) return;
    setBusy(member.userId);
    setMessage('');
    try {
      await onUpdateMember(campaignId, member.userId, patch);
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível atualizar o participante.');
    } finally {
      setBusy('');
    }
  };

  const linkOwnCharacter = async (characterId: string | null) => {
    if (!onLinkOwnCharacter) return;
    setBusy('own-character');
    setMessage('');
    try {
      await onLinkOwnCharacter(campaignId, characterId);
      setMessage(characterId ? 'Sua ficha foi vinculada à campanha.' : 'Sua ficha foi desvinculada da campanha.');
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível vincular sua ficha.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="campaign-members">
      <div className="campaign-members__head">
        <div>
          <p className="ro-eyebrow">Participantes</p>
          <h3>Membros da campanha</h3>
          <p>O jogador pode vincular a própria ficha, ou o Mestre pode entregar um Desvelado pronto pelo e-mail de login.</p>
        </div>
        <div className="campaign-members__invite">
          <code>{inviteCode}</code>
          <button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}><Copy size={13} /> Copiar</button>
          {canManage && onRegenerateInvite && (
            <button type="button" disabled={busy === 'invite'} onClick={regenerate}>
              <RefreshCw size={13} /> {busy === 'invite' ? 'Gerando…' : 'Novo código'}
            </button>
          )}
        </div>
      </div>

      {currentMember?.role === 'jogador' && onLinkOwnCharacter && (
        <article className="campaign-members__own-character">
          <div className="campaign-members__own-character-copy">
            <span className="campaign-members__portrait">
              {linkedCharacter?.imagemUrl
                ? <AssetImage src={linkedCharacter.imagemUrl} alt="" />
                : <UserRound size={20} />}
            </span>
            <div>
              <p className="ro-eyebrow">Sua ficha nesta mesa</p>
              <strong>{linkedCharacter?.nome || 'Escolha seu Desvelado'}</strong>
              <small>A ficha continua sendo sua. Vida, Foco, Ruptura e demais alterações feitas na mesa ficam salvas nela.</small>
            </div>
          </div>
          <label>
            <span>Desvelado vinculado</span>
            <select
              value={currentMember.characterId || ''}
              disabled={busy === 'own-character'}
              onChange={event => void linkOwnCharacter(event.target.value || null)}
            >
              <option value="">Entrar sem personagem</option>
              {ownChoices.map(character => (
                <option key={character.id} value={character.id}>
                  {character.nome} · Nível {character.nivel}{character.campaignId === campaignId ? ' · nesta campanha' : ''}
                </option>
              ))}
            </select>
          </label>
          {currentMember.characterId && <span className="campaign-members__linked"><Check size={13} /> Ficha conectada</span>}
        </article>
      )}

      {canManage && onManagePreparedCharacter && (
        <section className="campaign-members__roster" aria-label="Fichas preparadas pelo Mestre">
          <p className="ro-eyebrow">Elenco preparado pelo Mestre</p>
          <strong>Adicionar personagens à campanha</strong>
          <p>Suas fichas entram no elenco sem código de convite e sem ocupar sua única vaga de personagem como participante. Você pode adicionar várias.</p>
          <div className="campaign-members__roster-add">
            <label><span>Ficha da minha biblioteca</span>
              <select value={rosterChoice} disabled={Boolean(busy) || !freeCharacters.length}
                onChange={event => setRosterChoice(event.target.value)}>
                <option value="">Selecione um Desvelado livre</option>
                {freeCharacters.map(character => (
                  <option value={character.id} key={character.id}>{character.nome} · Nível {character.nivel}</option>
                ))}
              </select>
            </label>
            <button type="button" disabled={Boolean(busy) || !rosterChoice}
              onClick={() => { void managePrepared(rosterChoice, true); }}>
              Adicionar ao elenco
            </button>
          </div>
          {stagedCharacters.length > 0 && (
            <div className="campaign-members__roster-list">
              <small>{stagedCharacters.length} fichas suas nesta campanha</small>
              {stagedCharacters.map(character => {
                const linkedMember = members.find(m => m.characterId === character.id);
                const belongsToMasterSlot = linkedMember?.userId === currentUserId && linkedMember.role === 'mestre';
                const assignedToOtherMember = Boolean(linkedMember && !belongsToMasterSlot);
                return <div key={character.id} className="campaign-members__roster-row">
                  <span>{character.nome} · Nível {character.nivel}</span>
                  <button type="button" disabled={Boolean(busy) || assignedToOtherMember}
                    title={assignedToOtherMember ? 'Personagem atribuído a um participante.' : belongsToMasterSlot
                      ? 'Libera o antigo vínculo único do Mestre, mantendo a ficha no elenco.' : 'Retira a ficha do elenco sem apagá-la'}
                    onClick={() => { void managePrepared(character.id, belongsToMasterSlot); }}>
                    {assignedToOtherMember ? 'Já atribuído' : belongsToMasterSlot ? 'Liberar vínculo do Mestre' : 'Retirar'}
                  </button>
                </div>;
              })}
            </div>
          )}
        </section>
      )}

      {canManage && onAssignPreparedCharacter && (
        <form className="campaign-members__assign-by-email"
          onSubmit={event => { event.preventDefault(); void assignPrepared(); }}>
          <div>
            <p className="ro-eyebrow">Personagens prontos</p>
            <strong>Entregar Desvelado por e-mail</strong>
            <small>O jogador deve possuir conta e já ter entrado nesta campanha pelo convite. A entrega transfere a ficha para a conta dele.</small>
          </div>
          <label>
            <span>Ficha preparada pelo Mestre</span>
            <select required value={preparedCharacterId} disabled={busy === 'prepared-character'}
              onChange={event => setPreparedCharacterId(event.target.value)}>
              <option value="">Selecione a ficha</option>
              {availablePrepared.map(character => (
                <option key={character.id} value={character.id}>{character.nome} · Nível {character.nivel}</option>
              ))}
            </select>
          </label>
          <label>
            <span>E-mail de login do jogador</span>
            <input type="email" required autoComplete="email" maxLength={254}
              placeholder="jogador@exemplo.com"
              value={preparedPlayerEmail} disabled={busy === 'prepared-character'}
              onChange={event => setPreparedPlayerEmail(event.target.value)} />
          </label>
          <button type="submit" disabled={Boolean(busy) || !preparedCharacterId || !preparedPlayerEmail.trim()}>
            {busy === 'prepared-character' ? 'Entregando…' : 'Entregar ficha ao e-mail'}
          </button>
        </form>
      )}

      <div className="campaign-members__list">
        {members.map(member => {
          const self = member.userId === currentUserId;
          const memberCharacter = characters.find(character => character.id === member.characterId);

          return (
            <article key={member.userId} className="campaign-members__member">
              <div className="campaign-members__identity">
                <span className="campaign-members__portrait">
                  {memberCharacter?.imagemUrl
                    ? <AssetImage src={memberCharacter.imagemUrl} alt="" />
                    : <UserRound size={18} />}
                </span>
                <div>
                  <strong>{member.nome || 'Participante'}</strong>
                  <small>
                    {self ? 'Você · ' : ''}
                    {member.status === 'ativo' ? 'Ativo' : member.status}
                    {memberCharacter ? ` · ${memberCharacter.nome}` : member.role === 'jogador' ? ' · sem ficha' : ''}
                  </small>
                </div>
              </div>

              <div className="campaign-members__actions">
                {canManage && !self ? (
                  <>
                    <select
                      aria-label={`Papel de ${member.nome || 'participante'}`}
                      value={member.role}
                      disabled={busy === member.userId}
                      onChange={event => void update(member, { role: event.target.value as MembroCampanha['role'] })}
                    >
                      <option value="jogador">Jogador</option>
                      <option value="observador">Observador</option>
                      <option value="mestre">Mestre</option>
                    </select>
                    <span className="campaign-members__sheet-status">
                      <Link2 size={12} />
                      {memberCharacter ? memberCharacter.nome : 'Jogador escolhe a própria ficha'}
                    </span>
                    <button
                      type="button"
                      disabled={busy === member.userId}
                      onClick={() => void update(member, { status: member.status === 'ativo' ? 'removido' : 'ativo' })}
                    >
                      {member.status === 'ativo' ? 'Remover' : 'Reativar'}
                    </button>
                  </>
                ) : (
                  <span>{member.role}</span>
                )}
              </div>
            </article>
          );
        })}
        {members.length === 0 && <p className="campaign-members__empty">Nenhum participante carregado.</p>}
      </div>

      {message && <p className="campaign-members__message" role="status">{message}</p>}
    </section>
  );
};
