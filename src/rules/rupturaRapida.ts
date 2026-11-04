import type { Personagem, RupturaLog } from '../types/character';

/**
 * Ajuste rápido de Ruptura (botões − e +): muda o valor (0 a 6) e registra no histórico,
 * no mesmo formato da janela de Ruptura. Se o valor não muda (já está em 0 ou 6), devolve a ficha igual.
 */
export function ajustarRuptura<T extends Personagem>(
  p: T,
  delta: number,
  motivo = '',
  agora: Date = new Date()
): T {
  const anterior = p.ruptura ?? 0;
  const novo = Math.max(0, Math.min(6, anterior + delta));
  if (novo === anterior) return p;
  const registro: RupturaLog = {
    id: `rup-${agora.getTime()}`,
    dataHora: `${agora.toLocaleTimeString('pt-BR')} ${agora.toLocaleDateString('pt-BR')}`,
    valorAnterior: anterior,
    novoValor: novo,
    motivo: motivo.trim() || (delta >= 0 ? `Ajuste rápido +${novo - anterior}` : `Ajuste rápido ${novo - anterior}`),
    origem: 'manual'
  };
  return { ...p, ruptura: novo, historicoRuptura: [registro, ...(p.historicoRuptura || [])], atualizadoEm: agora.toISOString() };
}
