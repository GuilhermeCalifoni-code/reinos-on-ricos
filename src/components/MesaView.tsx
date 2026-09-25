import React from 'react';
import { Campanha } from '../types/campaign';
import { UserRole } from '../types/auth';
import { Personagem } from '../types/character';
import { LiveTable } from './live/LiveTable';

interface MesaViewProps {
  campanha: Campanha;
  personagens: Personagem[];
  role: UserRole;
  personagemJogadorId?: string;
  onVoltarParaCampanha: () => void;
  onAtualizarPersonagem: (p: Personagem) => void;
  onAbrirModalRupturaPara: (p: Personagem, delta: number, motivo: string) => void;
  onAbrirFichaPersonagem: (p: Personagem) => void;
}

export const MesaView: React.FC<MesaViewProps> = ({
  campanha, personagens, role, personagemJogadorId, onVoltarParaCampanha,
  onAtualizarPersonagem, onAbrirModalRupturaPara, onAbrirFichaPersonagem
}) => (
  <LiveTable
    campanha={campanha}
    personagens={personagens}
    role={role}
    personagemJogadorId={personagemJogadorId}
    onVoltar={onVoltarParaCampanha}
    onAtualizarPersonagem={onAtualizarPersonagem}
    onAbrirRuptura={onAbrirModalRupturaPara}
    onAbrirFicha={onAbrirFichaPersonagem}
  />
);
