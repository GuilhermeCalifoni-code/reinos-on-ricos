import React, { useState } from 'react';
import { Contador, DirecaoContador, EstadoContador, TipoContador, VisibilidadeConteudo } from '../../types/campaign';

interface CounterPanelProps {
  campanhaId: string;
  contadores: Contador[];
  mestre: boolean;
  onAdicionar: (contador: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizar: (id: string, parcial: Partial<Contador>) => void;
  onRemover: (id: string) => void;
  onDuplicar: (id: string) => void;
  compacto?: boolean;
}

const visiveisParaJogador = (contador: Contador) => contador.visibilidade !== 'mestre_privado';

export const CounterPanel: React.FC<CounterPanelProps> = ({
  campanhaId, contadores, mestre, onAdicionar, onAtualizar, onRemover, onDuplicar, compacto = false
}) => {
  const [novoNome, setNovoNome] = useState('');
  const [novoMaximo, setNovoMaximo] = useState(6);
  const [novoTipo, setNovoTipo] = useState<TipoContador>('progresso');
  const [novaDirecao, setNovaDirecao] = useState<DirecaoContador>('crescente');
  const [novaVisibilidade, setNovaVisibilidade] = useState<VisibilidadeConteudo>('mestre_privado');
  const exibidos = mestre ? contadores : contadores.filter(visiveisParaJogador);
  const criar = (event: React.FormEvent) => {
    event.preventDefault();
    if (!novoNome.trim()) return;
    const valorMaximo = Math.max(1, novoMaximo);
    onAdicionar({ campanhaId, nome: novoNome.trim(), tipo: novoTipo, valorAtual: novaDirecao === 'decrescente' ? valorMaximo : 0, valorMaximo, direcao: novaDirecao, visibilidade: novaVisibilidade, estado: 'ativo' });
    setNovoNome('');
    setNovoMaximo(6);
  };
  const ajustar = (contador: Contador, delta: number) => {
    const valor = Math.max(0, Math.min(contador.valorMaximo, contador.valorAtual + delta));
    const concluido = contador.direcao === 'crescente' ? valor === contador.valorMaximo : valor === 0;
    onAtualizar(contador.id, { valorAtual: valor, estado: concluido ? 'concluido' : contador.estado === 'concluido' ? 'ativo' : contador.estado });
  };
  const alternarVisibilidade = (contador: Contador) => {
    const proxima: VisibilidadeConteudo = contador.visibilidade === 'mestre_privado' ? 'revelado_jogadores' : 'mestre_privado';
    onAtualizar(contador.id, { visibilidade: proxima });
  };
  const editar = (contador: Contador) => {
    const nome = window.prompt('Nome do contador', contador.nome);
    if (nome?.trim()) onAtualizar(contador.id, { nome: nome.trim() });
    const descricao = window.prompt('Descrição ou gatilho narrativo', contador.descricao || contador.gatilho || '');
    if (descricao !== null) onAtualizar(contador.id, { descricao: descricao.trim() || undefined });
  };
  if (compacto) return <div className="live-counter-preview">{exibidos.slice(0, 2).map(contador => <div key={contador.id}><span className="live-counter-preview__dial" style={{ '--counter-progress': `${(contador.valorAtual / contador.valorMaximo) * 100}%` } as React.CSSProperties}>{contador.valorAtual}/{contador.valorMaximo}</span><span><strong>{contador.nome}</strong><small>{contador.estado === 'concluido' ? 'Concluído' : contador.tipo}</small></span></div>)}{exibidos.length === 0 && <p>Nenhum contador revelado.</p>}</div>;

  return (
    <section className="counter-panel">
      <header><div><p className="ro-eyebrow">Ritmo narrativo</p><h2>Contadores</h2></div>{mestre && <span>{contadores.length} ativos</span>}</header>
      {mestre && <form onSubmit={criar} className="counter-panel__create"><input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Porta Selada" aria-label="Nome do contador" /><input type="number" min="1" value={novoMaximo} onChange={(e) => setNovoMaximo(Number(e.target.value))} aria-label="Valor máximo" /><select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as TipoContador)} aria-label="Tipo de contador"><option value="tempo">Tempo</option><option value="progresso">Progresso</option><option value="problema">Problema</option><option value="conflito">Conflito</option><option value="personalizado">Personalizado</option></select><select value={novaDirecao} onChange={(e) => setNovaDirecao(e.target.value as DirecaoContador)} aria-label="Direção"><option value="crescente">Crescente</option><option value="decrescente">Decrescente</option></select><select value={novaVisibilidade} onChange={(e) => setNovaVisibilidade(e.target.value as VisibilidadeConteudo)} aria-label="Visibilidade"><option value="mestre_privado">Mestre</option><option value="compartilhado">Compartilhado</option><option value="revelado_jogadores">Revelado</option></select><button className="ro-button">Criar</button></form>}
      <div className="counter-panel__list">
        {exibidos.map(contador => <article key={contador.id} className={`counter-panel__item ${contador.estado === 'concluido' ? 'is-complete' : ''}`}>
          <div className="counter-panel__meter" style={{ '--counter-progress': `${(contador.valorAtual / contador.valorMaximo) * 100}%` } as React.CSSProperties}><span>{contador.valorAtual}<small>/{contador.valorMaximo}</small></span></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3>{contador.nome}</h3><span>{contador.tipo}</span>{contador.estado === 'pausado' && <span>Pausado</span>}</div>{contador.descricao && <p>{contador.descricao}</p>}{mestre && <small>{contador.visibilidade === 'mestre_privado' ? 'Privado do Mestre' : contador.visibilidade === 'compartilhado' ? 'Compartilhado' : 'Revelado aos jogadores'}</small>}</div>
          {mestre && <div className="counter-panel__quick"><button onClick={() => ajustar(contador, -1)} aria-label={`Reduzir ${contador.nome}`}>−</button><button onClick={() => ajustar(contador, 1)} aria-label={`Avançar ${contador.nome}`}>+</button></div>}
          {mestre && <div className="counter-panel__actions"><button onClick={() => editar(contador)}>Editar</button><button onClick={() => onAtualizar(contador.id, { valorAtual: contador.direcao === 'crescente' ? contador.valorMaximo : 0, estado: 'concluido' })}>Concluir</button><button onClick={() => onAtualizar(contador.id, { valorAtual: contador.direcao === 'crescente' ? 0 : contador.valorMaximo, estado: 'ativo' })}>Resetar</button><button onClick={() => onAtualizar(contador.id, { estado: contador.estado === 'pausado' ? 'ativo' : 'pausado' } as { estado: EstadoContador })}>{contador.estado === 'pausado' ? 'Retomar' : 'Pausar'}</button><button onClick={() => alternarVisibilidade(contador)}>{contador.visibilidade === 'mestre_privado' ? 'Revelar' : 'Ocultar'}</button><button onClick={() => onDuplicar(contador.id)}>Duplicar</button><button onClick={() => onRemover(contador.id)} className="is-danger">Excluir</button></div>}
        </article>)}
        {exibidos.length === 0 && <p className="live-table__empty">{mestre ? 'Crie um contador para acompanhar a tensão, o tempo ou uma consequência.' : 'Nenhum contador foi revelado à mesa.'}</p>}
      </div>
    </section>
  );
};
