import React, { useState } from 'react';
import { DESCRICAO_DOMINIOS, LINGUAGEM_DOMINIOS, TABELA_PROGRESSAO } from '../rules/rulesData';

type Secao = 'testes' | 'sonhar' | 'combate' | 'sobrevivencia' | 'mesa';

const Tab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} className={active ? 'rules-reference__tab is-active' : 'rules-reference__tab'}>
    {children}
  </button>
);

export const RulesReference: React.FC = () => {
  const [secao, setSecao] = useState<Secao>('testes');

  return (
    <section className="rules-reference">
      <header className="rules-reference__header">
        <div>
          <p className="ro-eyebrow">Referência de mesa</p>
          <h2>Regras essenciais</h2>
        </div>
        <p>Resumo alinhado ao Guia Autônomo de Playtest atual.</p>
      </header>

      <nav className="rules-reference__tabs" aria-label="Seções de regras">
        <Tab active={secao === 'testes'} onClick={() => setSecao('testes')}>Testes</Tab>
        <Tab active={secao === 'sonhar'} onClick={() => setSecao('sonhar')}>Sonhar</Tab>
        <Tab active={secao === 'combate'} onClick={() => setSecao('combate')}>Tensão</Tab>
        <Tab active={secao === 'sobrevivencia'} onClick={() => setSecao('sobrevivencia')}>Dano & Morte</Tab>
        <Tab active={secao === 'mesa'} onClick={() => setSecao('mesa')}>Mesa</Tab>
      </nav>

      {secao === 'testes' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Teste Mundano</p>
            <h3>1d20 + Atributo ≥ DT</h3>
            <p>Role apenas quando existir incerteza relevante e consequência interessante para a falha. Um 20 natural é sucesso automático; se o teste causar dano, o dano é crítico.</p>
            <div className="rules-reference__grid rules-reference__grid--dt">
              {[[8,'Trivial'],[10,'Fácil'],[12,'Comum'],[14,'Desafiador'],[16,'Difícil'],[18,'Muito difícil'],[20,'Extraordinário'],['>20','Onírico']].map(([dt,nome]) => <span key={String(dt)}><strong>{dt}</strong>{nome}</span>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Teste Reflexo</p>
            <h3>Um Teste Mundano em resposta a um gatilho</h3>
            <p>O Mestre escolhe Atributo e DT conforme a ficção. Foco pode ser usado normalmente. Vantagem e Desvantagem aplicam-se a Testes Mundanos e Reflexos, nunca a Testes Oníricos.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Teste Onírico</p>
            <h3>Realidade + Sonhar, cada dado contra a DT</h3>
            <p>Role 2d20 + o mesmo Atributo apropriado. A DT é normalmente 13. Os dados não competem entre si e não existem margens de sucesso. Antes do Teste, até 1 PF pode ser gasto para +2 no Teste; o bônus se aplica aos dois resultados.</p>
            <div className="rules-reference__outcomes">
              <div><strong>Convergência</strong><span>ambos passam</span><p>Manifestação acontece; é crítico; Ruptura −1.</p></div>
              <div><strong>Realidade vence</strong><span>Realidade passa</span><p>Manifestação não acontece; Ruptura 0.</p></div>
              <div><strong>Sonhar vence</strong><span>Sonhar passa</span><p>Manifestação acontece; Ruptura +1.</p></div>
              <div><strong>Divergência</strong><span>ambos falham</span><p>Manifestação não acontece; Ruptura +2.</p></div>
            </div>
          </article>
        </div>
      )}

      {secao === 'sonhar' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Princípio</p>
            <h3>O Sonhar não possui lista fechada de poderes</h3>
            <p>O Jogador declara o que deseja tornar possível. O Domínio determina a possibilidade; o nível determina a profundidade; a narrativa determina a forma; o Teste Onírico determina o encontro entre Sonhar e Realidade.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Linguagem dos níveis</p>
            <div className="rules-reference__levels">
              {LINGUAGEM_DOMINIOS.map(item => <div key={item.nivel}><strong>{item.nivel}</strong><span>{item.verbo}</span><p>{item.descricao}</p></div>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Domínios</p>
            <div className="rules-reference__domains">
              {Object.values(DESCRICAO_DOMINIOS).map(dominio => <div key={dominio.nome}><h4>{dominio.nome}</h4><p>{dominio.tema}</p><small>{dominio.manifestacoesTipicas}</small></div>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Guia do Sonhar</p>
            <h3>Fluxo de uma manifestação</h3>
            <p>Intenção → Domínio → Nível → Combinação? → Alcance → Alvos/Área → Duração → Potência → Atributo → DT → Teste Onírico → Manifestação → Ruptura/Delírio → Consequências.</p>
            <p><strong>Combinação:</strong> o Domínio Principal precisa possuir nível ao menos 1 maior que cada secundário. Para Potência, use o maior nível combinado. Os níveis não são somados.</p>
          </article>
        </div>
      )}

      {secao === 'combate' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Cena de Tensão</p>
            <h3>Não há iniciativa</h3>
            <p>Os Jogadores escolhem sua ordem e os Turnos alternam Jogador e Mestre. A Rodada termina quando todos os Jogadores tiveram um Turno. Mais Adversários não concedem automaticamente mais Ações ao Mestre.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Movimento</p>
            <h3>Movimento integra a Ação</h3>
            <p>O Movimento pode ser dividido antes e depois da Ação. O Deslocamento básico é Próximo. Correr exige Teste Reflexo de Corpo DT 15 ou mais; sucesso duplica o Deslocamento na Ação, falha mantém o normal.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Ações</p>
            <div className="rules-reference__compact-list">
              <p><strong>Ataque:</strong> Teste Mundano contra Dificuldade do Adversário ou Defesa de Personagem.</p>
              <p><strong>Agarrar/Derrubar/Imobilizar:</strong> Teste Mundano de Corpo; sucesso pode impor uma Condição apropriada.</p>
              <p><strong>Sonhar:</strong> Teste Onírico.</p>
              <p><strong>Ataque + Sonhar:</strong> uma única Ação e um único Teste Onírico; DT = maior entre 13 e a Dificuldade do alvo.</p>
              <p><strong>Ajudar:</strong> Vantagem no próximo Teste Mundano; para ajudar Sonhar, gaste a Ação e reduza a DT Onírica do aliado em 2.</p>
            </div>
          </article>
        </div>
      )}

      {secao === 'sobrevivencia' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Valores essenciais</p>
            <div className="rules-reference__stats">
              <span><strong>Resistência</strong>6 + Corpo</span>
              <span><strong>Defesa</strong>8 + Corpo</span>
              <span><strong>PO</strong>2</span>
              <span><strong>Ruptura</strong>0 a 6</span>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Converter dano em PV</p>
            <div className="rules-reference__compact-list">
              <p><strong>Dano ≤ R:</strong> perde 1 PV.</p>
              <p><strong>Dano &gt; R:</strong> perde 2 PV.</p>
              <p><strong>Dano Massivo opcional:</strong> dano &gt; 2 × R causa perda de 3 PV.</p>
              <p><strong>Proteção Onírica:</strong> depois da comparação, gaste no máximo 1 PO para reduzir a perda em 1 PV.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Movimento de Morte</p>
            <h3>0 PV → 2d20 sem Atributo contra DT 13</h3>
            <div className="rules-reference__compact-list">
              <p><strong>Convergência:</strong> recupere 2 PV.</p>
              <p><strong>Realidade vence:</strong> recupere 1 PV.</p>
              <p><strong>Sonhar vence:</strong> recupere 1 PV e +2 Ruptura.</p>
              <p><strong>Divergência:</strong> o Personagem morre; a descrição pertence ao Jogador.</p>
            </div>
          </article>
        </div>
      )}

      {secao === 'mesa' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Progressão</p>
            <div className="rules-reference__progression">
              {Object.values(TABELA_PROGRESSAO).map(nivel => (
                <div key={nivel.nivel}>
                  <strong>Nível {nivel.nivel}</strong>
                  <span>{nivel.vidaBase} PV · {nivel.focoBase} PF · {nivel.protecaoOniricaBase} PO</span>
                  <small>{nivel.pontosDeSonhar} Pontos de Sonhar · Domínio máx. {nivel.dominioMaximo}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Contadores</p>
            <h3>Processos, pressão, perseguições e conflitos em etapas</h3>
            <p>Defina valor inicial, objetivo, direção e gatilhos. Quando o Sonhar participa: Convergência progride 1 e −1 Ruptura; Realidade vence recua 1; Sonhar vence progride 1 e +1 Ruptura; Divergência recua 2 e +2 Ruptura, quando recuar fizer sentido.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Ruptura & Delírio</p>
            <p>Ao alcançar 6, resolva primeiro a manifestação que levou a trilha ao limite. Depois o Mestre estabelece um Efeito de Ruptura coerente e a trilha retorna a 0. Delírio Moderado ou Intenso acrescenta +1 Ruptura a todos os Desvelados presentes, independentemente da quantidade de testemunhas.</p>
          </article>
        </div>
      )}
    </section>
  );
};
