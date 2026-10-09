import React, { useState } from 'react';
import { Contador, DirecaoContador, EstadoContador, TipoContador } from '../../types/campaign';
import { NewSessionEvent } from '../../types/sessionEvent';

interface CounterPanelProps {
  campanhaId: string;
  contadores: Contador[];
  mestre: boolean;
  onAdicionar: (contador: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  onAtualizar: (id: string, parcial: Partial<Contador>) => void;
  onRemover: (id: string) => void;
  onDuplicar: (id: string) => void;
  compacto?: boolean;
  onRegistrarEvento?: (event: NewSessionEvent) => void;
}

const MAX_ALLOWED = 9999;

export const CounterPanel: React.FC<CounterPanelProps> = ({
  campanhaId, contadores, mestre, onAdicionar, onAtualizar, onRemover, onDuplicar, compacto = false, onRegistrarEvento
}) => {
  const [novoNome, setNovoNome] = useState('');
  const [novoMaximo, setNovoMaximo] = useState(6);
  const [novoTipo, setNovoTipo] = useState<TipoContador>('progresso');
  const [novaDirecao, setNovaDirecao] = useState<DirecaoContador>('crescente');
  const [maximosEditando, setMaximosEditando] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');

  // Todas as ações e todas as informações de contador pertencem somente ao Mestre.
  if (!mestre) return null;

  const registrar = (contador: Contador, valor: number, maximo: number, concluido: boolean) => {
    onRegistrarEvento?.({
      type: 'counter_update',
      visibility: 'mestre',
      content: `${contador.nome}: ${valor}/${maximo}${concluido ? ' — concluído.' : '.'}`,
      metadata: { counterId: contador.id, nome: contador.nome, anterior: contador.valorAtual, valor, maximo, concluido }
    });
  };

  const estadoPara = (contador: Contador, valor: number, maximo: number): EstadoContador => {
    if (contador.estado === 'pausado') return 'pausado';
    return (contador.direcao === 'crescente' ? valor >= maximo : valor <= 0) ? 'concluido' : 'ativo';
  };

  const atualizarValores = (contador: Contador, valor: number, maximo: number) => {
    if (!Number.isInteger(maximo) || maximo < 1 || maximo > MAX_ALLOWED) {
      setErro(`O máximo deve estar entre 1 e ${MAX_ALLOWED}.`);
      return;
    }
    const atual = Math.max(0, Math.min(maximo, Math.trunc(valor)));
    const estado = estadoPara(contador, atual, maximo);
    setErro('');
    onAtualizar(contador.id, { valorAtual: atual, valorMaximo: maximo, estado, visibilidade: 'mestre_privado' });
    registrar(contador, atual, maximo, estado === 'concluido');
  };

  const criar = (event: React.FormEvent) => {
    event.preventDefault();
    const nome = novoNome.trim();
    if (!nome || nome.length > 160 || !Number.isInteger(novoMaximo) || novoMaximo < 1 || novoMaximo > MAX_ALLOWED) {
      setErro('Informe um nome de até 160 caracteres e um máximo entre 1 e 9999.');
      return;
    }
    setErro('');
    onAdicionar({
      campanhaId, nome, tipo: novoTipo,
      valorAtual: novaDirecao === 'decrescente' ? novoMaximo : 0,
      valorMaximo: novoMaximo, direcao: novaDirecao, visibilidade: 'mestre_privado', estado: 'ativo'
    });
    setNovoNome('');
    setNovoMaximo(6);
  };

  const ajustar = (contador: Contador, delta: number) => {
    atualizarValores(contador, contador.valorAtual + delta, contador.valorMaximo);
  };

  const ajustarMaximo = (contador: Contador, delta: number) => {
    const novo = Math.max(1, Math.min(MAX_ALLOWED, contador.valorMaximo + delta));
    atualizarValores(contador, contador.valorAtual, novo);
    setMaximosEditando(items => ({ ...items, [contador.id]: String(novo) }));
  };

  const aplicarMaximo = (contador: Contador) => {
    const raw = maximosEditando[contador.id];
    if (raw === undefined || raw.trim() === '') {
      setErro('Informe o máximo do contador.');
      return;
    }
    atualizarValores(contador, contador.valorAtual, Number(raw));
  };

  const editar = (contador: Contador) => {
    const nome = window.prompt('Nome do contador', contador.nome);
    if (nome?.trim() && nome.trim().length <= 160) onAtualizar(contador.id, { nome: nome.trim() });
    const descricao = window.prompt('Descrição ou gatilho narrativo', contador.descricao || contador.gatilho || '');
    if (descricao !== null) onAtualizar(contador.id, { descricao: descricao.trim() || undefined });
  };

  if (compacto) return (
    <div className="live-counter-preview">
      {contadores.slice(0, 2).map(contador => <div key={contador.id}>
        <span className="live-counter-preview__dial" style={{ '--counter-progress': `${(contador.valorAtual / contador.valorMaximo) * 100}%` } as React.CSSProperties}>{contador.valorAtual}/{contador.valorMaximo}</span>
        <span><strong>{contador.nome}</strong><small>{contador.estado === 'concluido' ? 'Concluído' : contador.tipo}</small></span>
      </div>)}
      {contadores.length === 0 && <p>Nenhum contador criado.</p>}
    </div>
  );

  return (
    <section className="counter-panel counter-panel--master">
      <header><div><p className="ro-eyebrow">Ferramenta exclusiva do Mestre</p><h2>Contadores da sessão</h2></div><span>{contadores.length} contador(es)</span></header>
      <p className="counter-panel__hint">Acompanhe a tensão e a progressão dos acontecimentos. Nenhum contador é revelado aos jogadores.</p>
      <form onSubmit={criar} className="counter-panel__create">
        <label>Nome do contador
          <input required maxLength={160} value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex.: Portal prestes a abrir" />
        </label>
        <label>Máximo
          <input type="number" min="1" max={MAX_ALLOWED} step="1" value={novoMaximo} onChange={e => setNovoMaximo(Number(e.target.value))} />
        </label>
        <label>Tipo
          <select value={novoTipo} onChange={e => setNovoTipo(e.target.value as TipoContador)}>
            <option value="tempo">Tempo</option><option value="progresso">Progresso</option>
            <option value="problema">Problema</option><option value="conflito">Conflito</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </label>
        <label>Direção
          <select value={novaDirecao} onChange={e => setNovaDirecao(e.target.value as DirecaoContador)}>
            <option value="crescente">Crescente</option><option value="decrescente">Decrescente</option>
          </select>
        </label>
        <button type="submit" className="ro-button">Criar contador</button>
      </form>
      {erro && <p role="alert" className="counter-panel__error">{erro}</p>}
      <div className="counter-panel__list">
        {contadores.map(contador => <article key={contador.id} className={`counter-panel__item ${contador.estado === 'concluido' ? 'is-complete' : ''}`}>
          <div className="counter-panel__meter" style={{ '--counter-progress': `${(contador.valorAtual / contador.valorMaximo) * 100}%` } as React.CSSProperties}>
            <span>{contador.valorAtual}<small>/{contador.valorMaximo}</small></span>
          </div>
          <div className="counter-panel__details">
            <h3>{contador.nome}</h3>
            <small>{contador.tipo} · {contador.estado} · {contador.direcao}</small>
            {contador.descricao && <p>{contador.descricao}</p>}
          </div>
          <div className="counter-panel__value-edit">
            <span>Valor atual</span>
            <div className="counter-panel__stepper">
              <button type="button" onClick={() => ajustar(contador,-1)} disabled={contador.valorAtual <= 0} aria-label={`Diminuir valor de ${contador.nome}`}>−</button>
              <output aria-label={`Valor atual de ${contador.nome}`}>{contador.valorAtual}</output>
              <button type="button" onClick={() => ajustar(contador,1)} disabled={contador.valorAtual >= contador.valorMaximo} aria-label={`Aumentar valor de ${contador.nome}`}>+</button>
            </div>
          </div>
          <div className="counter-panel__max-edit">
            <label htmlFor={`counter-max-${contador.id}`}>Valor máximo</label>
            <div className="counter-panel__stepper counter-panel__stepper--max">
              <button type="button" onClick={() => ajustarMaximo(contador,-1)} disabled={contador.valorMaximo <= 1} aria-label={`Diminuir máximo de ${contador.nome}`}>−</button>
              <input id={`counter-max-${contador.id}`} type="number" inputMode="numeric" min="1" max={MAX_ALLOWED} step="1" value={maximosEditando[contador.id] ?? String(contador.valorMaximo)} onChange={e => setMaximosEditando(items => ({...items,[contador.id]:e.target.value}))} aria-label={`Máximo de ${contador.nome}`}/>
              <button type="button" onClick={() => ajustarMaximo(contador,1)} disabled={contador.valorMaximo >= MAX_ALLOWED} aria-label={`Aumentar máximo de ${contador.nome}`}>+</button>
            </div>
            <button type="button" className="counter-panel__apply" onClick={() => aplicarMaximo(contador)}>Aplicar máximo</button>
          </div>
          <div className="counter-panel__actions">
            <button type="button" onClick={() => editar(contador)}>Editar nome</button>
            <button type="button" onClick={() => atualizarValores(contador,contador.direcao === 'crescente' ? contador.valorMaximo : 0,contador.valorMaximo)}>Concluir</button>
            <button type="button" onClick={() => atualizarValores(contador,contador.direcao === 'crescente' ? 0 : contador.valorMaximo,contador.valorMaximo)}>Resetar</button>
            <button type="button" onClick={() => onAtualizar(contador.id,{estado: contador.estado==='pausado'?'ativo':'pausado'})}>{contador.estado==='pausado'?'Retomar':'Pausar'}</button>
            <button type="button" onClick={() => onDuplicar(contador.id)}>Duplicar</button>
            <button type="button" onClick={() => {if(window.confirm(`Excluir o contador ${contador.nome}?`))onRemover(contador.id);}} className="is-danger">Excluir</button>
          </div>
        </article>)}
        {contadores.length === 0 && <p className="live-table__empty">Nenhum contador por enquanto. Crie um acima, mesmo com a sessão em andamento.</p>}
      </div>
    </section>
  );
};
