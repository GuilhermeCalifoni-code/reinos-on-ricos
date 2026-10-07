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
  onLinkOwnCharacter
}) => {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const currentMember = members.find(member => member.userId === currentUserId);
  const linkedCharacter = characters.find(character => character.id === currentMember?.characterId);

  const ownChoices = useMemo(
    () => personalCharacters.filter(character =>
      character.ownerUserId === currentUserId
      && (!character.campaignId || character.campaignId === campaignId)
    ),
    [campaignId, currentUserId, personalCharacters]
  );

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
          <p>O jogador entra pelo convite e escolhe uma ficha que já pertence à própria conta.</p>
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
