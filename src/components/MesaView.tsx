import React from 'react';
import { Campanha, Cena, Contador, MapaNarrativo, MembroCampanha, TokenMapa } from '../types/campaign';
import { UserRole } from '../types/auth';
import { Personagem } from '../types/character';
import { LiveTable } from './live/LiveTable';

interface MesaViewProps {
  campanha: Campanha;
  personagens: Personagem[];
  role: UserRole;
  personagemJogadorId?: string;
  userId?: string;
  userName?: string;
  sessionId?: string;
  members?: MembroCampanha[];
  registroOnline: boolean;
  cenas: Cena[];
  onAdicionarCena: (cena: Omit<Cena, 'id'>) => Promise<unknown> | unknown;
  onAtualizarCena: (id: string, patch: Partial<Cena>) => Promise<unknown> | unknown;
  onRemoverCena: (id: string) => Promise<unknown> | unknown;
  onVoltarParaCampanha: () => void;
  onAtualizarPersonagem: (p: Personagem) => void;
  onAbrirModalRupturaPara: (p: Personagem, delta: number, motivo: string) => void;
  onAbrirFichaPersonagem: (p: Personagem) => void;
  contadores: Contador[];
  onAdicionarContador: (contador: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizarContador: (id: string, parcial: Partial<Contador>) => void;
  onRemoverContador: (id: string) => void;
  onDuplicarContador: (id: string) => void;
  mapas: MapaNarrativo[];
  onAdicionarMapa: (mapa: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizarMapa: (id: string, parcial: Partial<MapaNarrativo>) => void;
  onRemoverMapa: (id: string) => void;
  tokensMapa: TokenMapa[];
  onAdicionarTokenMapa: (token: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizarTokenMapa: (id: string, parcial: Partial<TokenMapa>) => void;
  onRemoverTokenMapa: (id: string) => void;
}

export const MesaView: React.FC<MesaViewProps> = ({
  campanha, personagens, role, personagemJogadorId, userId, userName, sessionId, members = [], registroOnline, cenas, onAdicionarCena, onAtualizarCena, onRemoverCena, onVoltarParaCampanha,
  onAtualizarPersonagem, onAbrirModalRupturaPara, onAbrirFichaPersonagem,
  contadores, onAdicionarContador, onAtualizarContador, onRemoverContador, onDuplicarContador,
  mapas, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, tokensMapa, onAdicionarTokenMapa, onAtualizarTokenMapa, onRemoverTokenMapa
}) => (
  <LiveTable
    campanha={campanha}
    personagens={personagens}
    role={role}
    personagemJogadorId={personagemJogadorId}
    userId={userId}
    userName={userName}
    sessionId={sessionId}
    members={members}
    registroOnline={registroOnline}
    cenas={cenas}
    onAdicionarCena={onAdicionarCena}
    onAtualizarCena={onAtualizarCena}
    onRemoverCena={onRemoverCena}
    onVoltar={onVoltarParaCampanha}
    onAtualizarPersonagem={onAtualizarPersonagem}
    onAbrirRuptura={onAbrirModalRupturaPara}
    onAbrirFicha={onAbrirFichaPersonagem}
    contadores={contadores}
    onAdicionarContador={onAdicionarContador}
    onAtualizarContador={onAtualizarContador}
    onRemoverContador={onRemoverContador}
    onDuplicarContador={onDuplicarContador}
    mapas={mapas}
    onAdicionarMapa={onAdicionarMapa}
    onAtualizarMapa={onAtualizarMapa}
    onRemoverMapa={onRemoverMapa}
    tokensMapa={tokensMapa}
    onAdicionarTokenMapa={onAdicionarTokenMapa}
    onAtualizarTokenMapa={onAtualizarTokenMapa}
    onRemoverTokenMapa={onRemoverTokenMapa}
  />
);
