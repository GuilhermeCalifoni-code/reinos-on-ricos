import React from 'react';
import { UserSession } from '../types/auth';

interface SettingsViewProps {
  session: UserSession | null;
  onAbrirModalSql: () => void;
  onTrocarSessao: () => void;
  onRestaurarExemplos: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  session,
  onAbrirModalSql,
  onTrocarSessao,
  onRestaurarExemplos
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#292929]">
        <h1 className="font-serif text-3xl text-[#F5F3EE] font-normal">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-[#666666] mt-1">
          Parâmetros de ambiente, perfil ativo e persistência em nuvem.
        </p>
      </div>

      {/* Perfil Ativo */}
      <div className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#666666]">
          Perfil Atual
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[#F5F3EE] font-medium">{session?.nome || 'Usuário'}</div>
            <div className="text-xs font-mono text-[#666666] mt-0.5">
              Função: {session?.role === 'mestre' ? 'Mestre / Narrador' : 'Jogador / Desvelado'} · Mesa: {session?.mesaCodigo || 'ONIRICO-01'}
            </div>
          </div>
          <button
            onClick={onTrocarSessao}
            className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-xs text-[#D9D7D2] rounded-sm transition-colors"
          >
            Trocar Perfil / Sair
          </button>
        </div>
      </div>

      {/* Nuvem & Banco de Dados Supabase */}
      <div className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#A88952]">
              Persistência & Sincronização Supabase
            </h2>
            <p className="text-xs text-[#666666] mt-1">
              Esquema SQL e variáveis de ambiente configuradas para campanhas, fichas e rolagens em tempo real.
            </p>
          </div>
          <button
            onClick={onAbrirModalSql}
            className="px-4 py-2 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium uppercase tracking-wider rounded-sm transition-colors"
          >
            Ver Script SQL
          </button>
        </div>
      </div>

      {/* Dados Locais */}
      <div className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#666666]">
          Restaurar Demonstração
        </h2>
        <p className="text-xs text-[#666666]">
          Caso deseje restaurar os personagens canônicos de exemplo (Caio Silveira, Dra. Elena Ramos, Rafael Mendes).
        </p>
        <button
          onClick={() => {
            if (confirm('Deseja restaurar as fichas de exemplo?')) {
              onRestaurarExemplos();
            }
          }}
          className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-xs text-[#D9D7D2] rounded-sm transition-colors"
        >
          Restaurar Fichas de Exemplo
        </button>
      </div>
    </div>
  );
};
