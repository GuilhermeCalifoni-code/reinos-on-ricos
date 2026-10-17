import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, X } from 'lucide-react';
import type { Personagem } from '../../types/character';

export interface CharacterAssignmentCampaign {
  id: string;
  nome: string;
}

interface Props {
  character: Personagem;
  campaigns: CharacterAssignmentCampaign[];
  onClose: () => void;
  onAssign: (campaignId: string, playerEmail: string, characterId: string) => Promise<void>;
}

/** Shared by the campaign roster and the global character library.
 * The RPCs enforce role, ownership, recipient's membership and email lookup.
 */
export const AssignCharacterModal: React.FC<Props> = ({ character, campaigns, onClose, onAssign }) => {
  const [campaignId, setCampaignId] = useState(character.campaignId || (campaigns.length === 1 ? campaigns[0].id : ''));
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();
  const descriptionId = useId();
  const validCampaigns = campaigns.filter(campaign => !character.campaignId || campaign.id === character.campaignId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!validCampaigns.some(c => c.id === campaignId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Selecione a campanha e informe um e-mail de login válido.');
      return;
    }
    if (!window.confirm(`Entregar definitivamente "${character.nome}" à conta ${trimmedEmail}? A ficha passará a pertencer ao jogador e não será apagada nenhuma ficha anterior.`)) return;

    setBusy(true);
    setError('');
    try {
      await onAssign(campaignId, trimmedEmail, character.id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível associar esta ficha.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="ro-assign-character-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) onClose();
    }} onKeyDown={event => {
      if (event.key === 'Escape' && !busy) onClose();
    }}>
      <section className="ro-assign-character-modal" role="dialog" aria-modal="true"
        aria-labelledby={titleId} aria-describedby={descriptionId}>
        <header className="ro-assign-character-modal__header">
          <div>
            <p className="ro-eyebrow">Entrega de Desvelado</p>
            <h2 id={titleId}>Associar jogador</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar associação"><X size={20} /></button>
        </header>

        <p id={descriptionId}>Entregar <strong>{character.nome}</strong> a uma conta de jogador. O destinatário precisa estar cadastrado e ser Jogador ativo da campanha.</p>

        <form onSubmit={event => { void submit(event); }}>
          <label>
            <span>Campanha</span>
            <select value={campaignId} required disabled={busy}
              onChange={event => setCampaignId(event.target.value)}>
              <option value="">Escolher campanha</option>
              {validCampaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.nome}</option>)}
            </select>
          </label>
          <label>
            <span>E-mail de login do jogador</span>
            <input autoFocus type="email" autoComplete="email" maxLength={254} required
              placeholder="jogador@exemplo.com" value={email} disabled={busy}
              onChange={event => setEmail(event.target.value)} />
          </label>
          <p className="ro-assign-character-modal__notice">A entrega transfere a propriedade da ficha para o jogador. O Mestre continuará vendo o Desvelado na campanha.</p>
          {error && <p className="ro-assign-character-modal__error" role="alert">{error}</p>}
          <div className="ro-assign-character-modal__actions">
            <button type="button" className="is-secondary" onClick={onClose} disabled={busy}>Cancelar</button>
            <button type="submit" disabled={busy || !email.trim() || !validCampaigns.some(c => c.id === campaignId)}>
              <Send size={16}/>{busy ? 'Entregando…' : 'Confirmar entrega'}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
};
