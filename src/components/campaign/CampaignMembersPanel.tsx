import React, { useState } from 'react';
import { MembroCampanha } from '../../types/campaign';

interface CampaignMembersPanelProps {
  campaignId: string;
  members: MembroCampanha[];
  inviteCode: string;
  currentUserId?: string;
  canManage: boolean;
  onRegenerateInvite?: (campaignId: string) => Promise<string>;
  onUpdateMember?: (campaignId: string, userId: string, patch: { role?: MembroCampanha['role']; status?: MembroCampanha['status']; characterId?: string | null }) => Promise<void>;
}

export const CampaignMembersPanel: React.FC<CampaignMembersPanelProps> = ({
  campaignId, members, inviteCode, currentUserId, canManage, onRegenerateInvite, onUpdateMember
}) => {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const regenerate = async () => {
    if (!onRegenerateInvite) return;
    setBusy('invite'); setMessage('');
    try {
      const code = await onRegenerateInvite(campaignId);
      await navigator.clipboard?.writeText(code);
      setMessage('Novo código gerado e copiado.');
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível regenerar o código.');
    } finally { setBusy(''); }
  };

  const update = async (member: MembroCampanha, patch: Parameters<NonNullable<typeof onUpdateMember>>[2]) => {
    if (!onUpdateMember) return;
    setBusy(member.userId); setMessage('');
    try { await onUpdateMember(campaignId, member.userId, patch); }
    catch (error: any) { setMessage(error.message || 'Não foi possível atualizar o participante.'); }
    finally { setBusy(''); }
  };

  return (
    <section className="campaign-members">
      <div className="campaign-members__head">
        <div>
          <p className="ro-eyebrow">Participantes</p>
          <h3>Membros da campanha</h3>
        </div>
        <div className="campaign-members__invite">
          <code>{inviteCode}</code>
          <button type="button" onClick={() => navigator.clipboard?.writeText(inviteCode)}>Copiar</button>
          {canManage && onRegenerateInvite && <button type="button" disabled={busy === 'invite'} onClick={regenerate}>{busy === 'invite' ? 'Gerando…' : 'Novo código'}</button>}
        </div>
      </div>

      <div className="campaign-members__list">
        {members.map(member => {
          const self = member.userId === currentUserId;
          return (
            <article key={member.userId} className="campaign-members__member">
              <div>
                <strong>{member.nome || 'Participante'}</strong>
                <small>{self ? 'Você · ' : ''}{member.status === 'ativo' ? 'Ativo' : member.status}</small>
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
                    <button type="button" disabled={busy === member.userId} onClick={() => void update(member, { status: member.status === 'ativo' ? 'removido' : 'ativo' })}>
                      {member.status === 'ativo' ? 'Remover' : 'Reativar'}
                    </button>
                  </>
                ) : <span>{member.role}</span>}
              </div>
            </article>
          );
        })}
        {members.length === 0 && <p className="campaign-members__empty">Nenhum participante carregado.</p>}
      </div>
      {message && <p className="campaign-members__message">{message}</p>}
    </section>
  );
};
