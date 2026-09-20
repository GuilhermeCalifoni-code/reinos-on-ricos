import React from 'react';
import { UserSession } from '../types/auth';

interface HeaderProps {
  campanhaNome?: string;
  rupturaNivel?: number;
  session: UserSession | null;
  onAbrirSql?: () => void;
  onAbrirPerfil?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  campanhaNome,
  rupturaNivel = 0,
  session,
  onAbrirSql
}) => {
  return (
    <header className="h-14 bg-[#0B0B0B] border-b border-[#292929] px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Esquerda: Breadcrumb sutil */}
      <div className="flex items-center gap-3 text-xs">
        <span className="font-mono text-[#666666] tracking-wider uppercase text-[11px]">
          Reinos Oníricos
        </span>
        {campanhaNome && (
          <>
            <span className="text-[#666666]/50">/</span>
            <span className="text-[#D9D7D2] font-medium truncate max-w-[280px]">
              {campanhaNome}
            </span>
          </>
        )}
      </div>

      {/* Direita: Ruptura discreta, Notificações e Perfil */}
      <div className="flex items-center gap-5">
        {/* Indicador sutil de Ruptura da Sessão */}
        {rupturaNivel > 0 && (
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#171717] border border-[#292929] text-xs"
            title={`Trilha de Ruptura Geral: ${rupturaNivel}/6`}
          >
            <span className="text-[10px] font-mono tracking-widest text-[#666666] uppercase">
              Ruptura
            </span>
            <span className={`font-mono font-medium ${
              rupturaNivel >= 5 
                ? 'text-[#F5F3EE]' 
                : rupturaNivel >= 3 
                ? 'text-[#A88952]' 
                : 'text-[#D9D7D2]'
            }`}>
              {rupturaNivel} / 6
            </span>
          </div>
        )}

        {/* Status de Sincronização / Supabase */}
        {onAbrirSql && (
          <button
            onClick={onAbrirSql}
            className="text-[11px] font-mono text-[#666666] hover:text-[#A88952] transition-colors flex items-center gap-1.5"
            title="Estrutura SQL & Conexão Supabase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A88952]/70" />
            <span>Nuvem</span>
          </button>
        )}

        {/* Notificações minimalistas */}
        <div className="relative text-[#666666] hover:text-[#D9D7D2] transition-colors cursor-pointer text-xs p-1" title="Sem notificações pendentes">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* Perfil */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#292929]">
          <div className="w-7 h-7 rounded bg-[#171717] border border-[#292929] flex items-center justify-center text-[11px] font-mono text-[#A88952]">
            {session?.nome ? session.nome.slice(0, 2).toUpperCase() : 'RO'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs text-[#F5F3EE] font-medium leading-none truncate max-w-[120px]">
              {session?.nome || 'Narrador'}
            </span>
            <span className="text-[10px] text-[#666666] font-mono uppercase leading-tight mt-0.5">
              {session?.role === 'mestre' ? 'Mestre' : 'Desvelado'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
