import React, { useState } from 'react';
import { Copy, Check, Database, Terminal, Download, ShieldCheck, Sparkles, ExternalLink, X } from 'lucide-react';
import { SUPABASE_SQL_QUERY } from '../data/supabaseSqlScript';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({ isOpen, onClose }) => {
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const handleCopiar = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_QUERY);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([SUPABASE_SQL_QUERY], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reinos_oniricos_supabase_schema.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="bg-[var(--ro-surface)] border border-cyan-500/30 w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-800 bg-[var(--ro-surface-raised)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-['Chakra_Petch'] tracking-wide flex items-center gap-2">
                SETUP SUPABASE — REINOS ONÍRICOS
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Migrations 001–009
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Execute o conjunto versionado no <strong>SQL Editor</strong> para criar autenticação, campanhas, RLS, Realtime, Registro Vivo e Storage.
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Passo a Passo Rápido */}
        <div className="px-6 py-3 bg-cyan-950/20 border-b border-cyan-900/30 text-xs text-cyan-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-[10px]">1</span>
            <span>Acesse o Supabase Dashboard</span>
            <span className="text-slate-600">→</span>
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-[10px]">2</span>
            <span>Abra a aba <strong>SQL Editor</strong></span>
            <span className="text-slate-600">→</span>
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-[10px]">3</span>
            <span>Cole a query abaixo e clique em <strong>Run</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiar}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                copiado
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              }`}
            >
              {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiado ? 'Query Copiada!' : 'Copiar Query'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded text-xs font-mono border border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              .sql
            </button>
          </div>
        </div>

        {/* Visualizador de Código SQL */}
        <div className="flex-1 overflow-auto p-4 bg-[#090b10] font-mono text-xs text-slate-300 select-all leading-relaxed border-b border-slate-800">
          <pre className="whitespace-pre-wrap">{SUPABASE_SQL_QUERY}</pre>
        </div>

        {/* Rodapé com Informações das Tabelas */}
        <div className="p-4 bg-[var(--ro-surface-raised)] text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-300">Base:</span>
            <span className="text-emerald-400">campaigns</span>
            <span className="text-cyan-400">personagens</span>
            <span className="text-purple-400">session_events</span>
            <span className="text-amber-400">live table + storage</span>
          </div>

          <button
            onClick={handleCopiar}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase font-['Chakra_Petch'] transition flex items-center justify-center gap-2"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? 'Copiado para Área de Transferência!' : 'Copiar Toda a Query SQL'}
          </button>
        </div>

      </div>
    </div>
  );
};
