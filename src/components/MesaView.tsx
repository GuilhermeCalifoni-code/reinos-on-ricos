import React from 'react';
import { Adversario, Campanha, Cena, Contador, Handout, MapaNarrativo, MembroCampanha, NPC, Pista, Sessao, TokenMapa } from '../types/campaign';
import { UserRole } from '../types/auth';
import { Personagem } from '../types/character';
import type { CharacterResourceUpdate } from '../features/realtime/liveTableRepository';
import { LiveTable } from './live/LiveTable';

interface MesaViewProps {
  campanha: Campanha;
  personagens: Personagem[];
  npcs: NPC[];
  adversarios: Adversario[];
  onAtualizarNPC: (id:string,patch:Partial<NPC>) => Promise<unknown>;
  onAtualizarAdversario: (id:string,patch:Partial<Adversario>) => Promise<unknown>;
  role: UserRole;
  personagemJogadorId?: string;
  userId?: string;
  userName?: string;
  sessionId?: string;
  sessionTitle?: string;
  sessionDescription?: string;
  sessao?: Sessao;
  cenas: Cena[];
  pistas: Pista[];
  handouts: Handout[];
  members?: MembroCampanha[];
  registroOnline: boolean;
  onVoltarParaCampanha: () => void;
  onAtualizarPersonagem: (p: Personagem) => void;
  onReceberRecursosPersonagem: (update: CharacterResourceUpdate) => void;
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
  onAtualizarSessao?: (id: string, patch: Partial<Sessao>) => Promise<unknown> | unknown;
  tokensMapa: TokenMapa[];
  onAdicionarTokenMapa: (token: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizarTokenMapa: (id: string, parcial: Partial<TokenMapa>) => void;
  onRemoverTokenMapa: (id: string) => void;
}

export const MesaView: React.FC<MesaViewProps> = ({
  campanha, personagens, npcs, adversarios, onAtualizarNPC, onAtualizarAdversario, role, personagemJogadorId, userId, userName, sessionId, sessionTitle, sessionDescription, sessao, cenas, pistas, handouts, members = [], registroOnline, onVoltarParaCampanha,
  onAtualizarPersonagem, onReceberRecursosPersonagem, onAbrirModalRupturaPara, onAbrirFichaPersonagem,
  contadores, onAdicionarContador, onAtualizarContador, onRemoverContador, onDuplicarContador,
  mapas, onAdicionarMapa, onAtualizarMapa, onRemoverMapa, onAtualizarSessao, tokensMapa, onAdicionarTokenMapa, onAtualizarTokenMapa, onRemoverTokenMapa
}) => (
  <LiveTable
    campanha={campanha}
    personagens={personagens}
    npcs={npcs}
    adversarios={adversarios}
    onAtualizarNPC={onAtualizarNPC}
    onAtualizarAdversario={onAtualizarAdversario}
    role={role}
    personagemJogadorId={personagemJogadorId}
    userId={userId}
    userName={userName}
    sessionId={sessionId}
    sessionTitle={sessionTitle}
    sessionDescription={sessionDescription}
    sessao={sessao}
    cenas={cenas}
    pistas={pistas}
    handouts={handouts}
    members={members}
    registroOnline={registroOnline}
    onVoltar={onVoltarParaCampanha}
    onAtualizarPersonagem={onAtualizarPersonagem}
    onReceberRecursosPersonagem={onReceberRecursosPersonagem}
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
    onAtualizarSessao={onAtualizarSessao}
    tokensMapa={tokensMapa}
    onAdicionarTokenMapa={onAdicionarTokenMapa}
    onAtualizarTokenMapa={onAtualizarTokenMapa}
    onRemoverTokenMapa={onRemoverTokenMapa}
  />
);
