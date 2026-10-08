import React, { useMemo, useState } from 'react';
import {
  DESCRICAO_DOMINIOS,
  DT_SONHAR_POR_NIVEL,
  LINGUAGEM_DOMINIOS,
  TABELA_AREA_DISTANCIA_DANO,
  TABELA_INTENSIDADE_DANO,
  TABELA_PROGRESSAO,
  TABELA_VIDA_FERIMENTO
} from '../rules/rulesData';
import {
  MATERIAIS_ESTRUTURA,
  PASSOS_POTENCIA_POR_NIVEL,
  REGRAS_PASSOS_POTENCIA,
  RESISTENCIA_ESTRUTURAS,
  TAMANHOS_OBJETO,
  MaterialEstrutural,
  TamanhoEstrutural,
  resolverDanoEstrutura
} from '../rules/referenceTables';

type Secao = 'testes' | 'sonhar' | 'potencia' | 'estruturas' | 'combate' | 'sobrevivencia' | 'mesa';

const Tab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick} className={active ? 'rules-reference__tab is-active' : 'rules-reference__tab'}>
    {children}
  </button>
);

export const RulesReference: React.FC = () => {
  const [secao, setSecao] = useState<Secao>('testes');
  const [material, setMaterial] = useState<MaterialEstrutural>('comum');
  const [tamanho, setTamanho] = useState<TamanhoEstrutural>('medio');
  const [danoEstrutura, setDanoEstrutura] = useState(8);
  const resultadoEstrutura = useMemo(
    () => resolverDanoEstrutura(danoEstrutura, material, tamanho),
    [danoEstrutura, material, tamanho]
  );

  return (
    <section className="rules-reference">
      <header className="rules-reference__header">
        <div>
          <p className="ro-eyebrow">Referência de mesa</p>
          <h2>Regras essenciais</h2>
        </div>
        <p>Consulta rápida do Livro Básico para usar durante a sessão sem quebrar o ritmo da mesa.</p>
      </header>

      <nav className="rules-reference__tabs" aria-label="Seções de regras">
        <Tab active={secao === 'testes'} onClick={() => setSecao('testes')}>Testes</Tab>
        <Tab active={secao === 'sonhar'} onClick={() => setSecao('sonhar')}>Sonhar</Tab>
        <Tab active={secao === 'potencia'} onClick={() => setSecao('potencia')}>Potência</Tab>
        <Tab active={secao === 'estruturas'} onClick={() => setSecao('estruturas')}>Objetos</Tab>
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
            <h3>Um Teste Mundano em resposta a perigo, habilidade ou evento disparador</h3>
            <p>O Mestre pede 1d20 + Atributo apropriado como resposta ao gatilho narrativo e determina a DT. Foco, Vantagem e Desvantagem aplicam-se normalmente. Não é uma rolagem extra automática em todos os ataques.</p>
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
            <p><strong>N1 — Percepção Onírica:</strong> o nível 1 de todos os cinco Domínios permite perceber e compreender aspectos existentes. Não exige Teste Onírico para percepção simples; informações complexas exigem teste e não há onisciência.</p>
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

          <article className="ro-surface">
            <p className="ro-eyebrow">Efeitos do Sonhar</p>
            <h3>DT para agir contra o que já foi manifestado</h3>
            <p>A manifestação acontece primeiro. Só peça um novo teste quando alguém tentar agir diretamente contra, resistir ou superar aquilo que o Sonhar tornou real. Superar a DT permite realizar aquela tentativa; não desfaz automaticamente a manifestação.</p>
            <div className="rules-reference__grid rules-reference__grid--dt">
              {Object.entries(DT_SONHAR_POR_NIVEL).map(([nivel, dt]) => (
                <span key={nivel}><strong>DT {dt}</strong>Nível {nivel}</span>
              ))}
            </div>
            <p>Se várias manifestações interferirem na mesma tentativa, use apenas a maior DT aplicável.</p>
          </article>
        </div>
      )}

      {secao === 'potencia' && (
        <div className="rules-reference__content">
          <article className="ro-surface rules-reference__feature">
            <p className="ro-eyebrow">Potência do Sonhar</p>
            <h3>Nível diz o que pode ser feito. Potência diz quanto aquilo é afetado.</h3>
            <p>Passos representam intensidade. Em cada manifestação, escolha uma única característica mecânica e aplique nela todos os Passos disponíveis. Os Passos não são uma moeda para dividir entre Dano, Defesa, Área, Resistência ou outras características.</p>
            <div className="rules-reference__power-levels">
              {PASSOS_POTENCIA_POR_NIVEL.map(item => (
                <div key={item.nivel}>
                  <span>Nível {item.nivel}</span>
                  <strong>{item.referencia}</strong>
                  <small>{item.linguagem}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Tabela de Passos</p>
            <h3>Traduzindo Potência em regras</h3>
            <div className="rules-reference__power-table">
              {REGRAS_PASSOS_POTENCIA.map(item => (
                <div key={item.id}>
                  <strong>{item.nome}</strong>
                  <p>{item.regra}</p>
                  {item.observacao && <small>{item.observacao}</small>}
                </div>
              ))}
            </div>
          </article>

          <article className="ro-surface rules-reference__note">
            <p className="ro-eyebrow">Uso correto</p>
            <div className="rules-reference__compact-list">
              <p><strong>Uma característica:</strong> todos os Passos vão para a característica escolhida.</p>
              <p><strong>Consequências naturais:</strong> uma manifestação pode causar dano, queda ou deslocamento como consequências da mesma alteração sem transformar cada consequência em um “benefício” comprado por Passo.</p>
              <p><strong>Dano:</strong> a progressão usual é d4 → d6 → d8 → d10 → d12. Potência não avança automaticamente para d20; d20 é reservado aos casos excepcionais indicados pelo livro.</p>
              <p><strong>Tamanho:</strong> o Livro Básico atualizado usa <em>Médio</em> como referência para Passos de Potência que alteram Tamanho.</p>
            </div>
          </article>
        </div>
      )}

      {secao === 'estruturas' && (
        <div className="rules-reference__content">
          <article className="ro-surface rules-reference__feature">
            <p className="ro-eyebrow">Objetos & Estruturas</p>
            <h3>Objetos não precisam de PV</h3>
            <p>Compare cada ocorrência de dano diretamente à Resistência do objeto. Dano ≤ R: resiste. Dano &gt; R: quebra, perfura, rompe ou é destruído de forma compatível com a ação. Danos inferiores não se acumulam entre tentativas, salvo deterioração persistente justificada pela narrativa.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Resistência estrutural</p>
            <h3>Material × quantidade de estrutura comprometida</h3>
            <div className="rules-reference__table-wrap">
              <table className="rules-reference__matrix">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Pequeno</th>
                    <th>Médio</th>
                    <th>Grande</th>
                    <th>Imenso</th>
                  </tr>
                </thead>
                <tbody>
                  {MATERIAIS_ESTRUTURA.map(item => (
                    <tr key={item.id}>
                      <th>{item.nome}</th>
                      <td>{RESISTENCIA_ESTRUTURAS[item.id].pequeno}</td>
                      <td>{RESISTENCIA_ESTRUTURAS[item.id].medio}</td>
                      <td>{RESISTENCIA_ESTRUTURAS[item.id].grande}</td>
                      <td>{RESISTENCIA_ESTRUTURAS[item.id].imenso}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rules-reference__material-notes">
              {MATERIAIS_ESTRUTURA.map(item => <p key={item.id}><strong>{item.nome}:</strong> {item.exemplos}</p>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Tamanho de objetos</p>
            <div className="rules-reference__sizes">
              {TAMANHOS_OBJETO.map(item => (
                <div key={item.id}><strong>{item.nome}</strong><p>{item.exemplos}</p></div>
              ))}
            </div>
            <p className="rules-reference__after-grid">O Tamanho representa quanto material precisa ser comprometido para obter o resultado, não necessariamente o tamanho total do prédio, veículo ou estrutura.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Teste rápido de estrutura</p>
            <h3>O dano atravessa a Resistência?</h3>
            <div className="rules-reference__structure-tool">
              <label>
                <span>Material</span>
                <select value={material} onChange={event => setMaterial(event.target.value as MaterialEstrutural)}>
                  {MATERIAIS_ESTRUTURA.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </label>
              <label>
                <span>Tamanho</span>
                <select value={tamanho} onChange={event => setTamanho(event.target.value as TamanhoEstrutural)}>
                  <option value="pequeno">Pequeno</option>
                  <option value="medio">Médio</option>
                  <option value="grande">Grande</option>
                  <option value="imenso">Imenso</option>
                </select>
              </label>
              <label>
                <span>Dano</span>
                <input type="number" min={0} value={danoEstrutura} onChange={event => setDanoEstrutura(Math.max(0, Number(event.target.value) || 0))} />
              </label>
              <div className={resultadoEstrutura.rompe ? 'rules-reference__structure-result is-broken' : 'rules-reference__structure-result'}>
                <span>R {resultadoEstrutura.resistencia}</span>
                <strong>{resultadoEstrutura.rompe ? 'ROMPE / QUEBRA' : 'RESISTE'}</strong>
              </div>
            </div>
            <p className="rules-reference__warning">A comparação só vale se a fonte de dano puder afetar aquele material daquela maneira. Um resultado alto não transforma um soco comum em ferramenta capaz de romper concreto maciço.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Potência em estruturas</p>
            <div className="rules-reference__compact-list">
              <p><strong>Resistência de materiais:</strong> cada Passo move uma categoria entre Frágil → Comum → Resistente → Muito Resistente. Os extremos são limites.</p>
              <p><strong>Tamanho:</strong> cada Passo desloca uma categoria, partindo de Pequeno como referência.</p>
              <p><strong>Não acumula automaticamente:</strong> escolher Tamanho não aumenta ao mesmo tempo a Resistência do material.</p>
              <p><strong>Peso e carga:</strong> use a escala de Tamanho como referência; Pequeno corresponde ao que uma pessoa comum consegue levar normalmente e uma categoria acima pode ser carregada com esforço.</p>
            </div>
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
            <p>O Movimento pode ser dividido antes e depois da Ação. O Deslocamento básico é Próximo. Para Correr, gaste sua Ação e desloque-se até Longe. Não é necessário Teste Reflexo para simplesmente Correr.</p>
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
            <p className="ro-eyebrow">Intensidade de dano</p>
            <div className="rules-reference__power-table">
              {TABELA_INTENSIDADE_DANO.map(item => (
                <div key={item.dado}>
                  <strong>{item.dado} · {item.intensidade}</strong>
                  <p>{item.exemplos}</p>
                </div>
              ))}
            </div>
            <p className="rules-reference__after-grid">Dano produzido ou manipulado diretamente pelo Sonhar soma o nível do Desvelado ao resultado do dado. O d20 é reservado a fenômenos/Criaturas Oníricas excepcionalmente poderosos e manifestações compatíveis com Sonhar 5.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Área & Distância máxima</p>
            <div className="rules-reference__table-wrap">
              <table className="rules-reference__matrix">
                <thead><tr><th>Fonte</th><th>Área</th><th>Distância</th><th>Exemplo</th></tr></thead>
                <tbody>
                  {TABELA_AREA_DISTANCIA_DANO.map(item => (
                    <tr key={item.tipo}><th>{item.tipo}</th><td>{item.area}</td><td>{item.distancia}</td><td>{item.exemplo}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rules-reference__after-grid">Área não vem automaticamente do dado de dano. Quando houver Área, faça um único ataque contra a maior Defesa entre os alvos e role o dano uma vez; o mesmo resultado vale para todos os atingidos.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Dano Contínuo</p>
            <p>Perigos como fogo, eletricidade e ácido causam o dano inicial normalmente. Se a fonte persistir, o Mestre resolve novas ocorrências conforme a duração e as circunstâncias narrativas. Uma manifestação instantânea não passa a causar dano a cada Rodada sem regra aplicável.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Movimento de Morte</p>
            <h3>0 PV → 2d20 sem Atributo contra DT 13</h3>
            <div className="rules-reference__compact-list">
              <p><strong>Convergência:</strong> recupere 2 PV.</p>
              <p><strong>Realidade vence:</strong> permanece Inconsciente com 0 PV; precisa de cuidados ou Descanso.</p>
              <p><strong>Sonhar vence:</strong> recupere 1 PV e +1 Ruptura.</p>
              <p><strong>Divergência:</strong> o Personagem morre; a descrição pertence ao Jogador.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Vida: Cura & Ferimento</p>
            <h3>O nível de Vida determina quanto o organismo pode ser alterado</h3>
            <div className="rules-reference__table-wrap">
              <table className="rules-reference__matrix">
                <thead><tr><th>Vida</th><th>Recuperação</th><th>Ferimento</th></tr></thead>
                <tbody>
                  {TABELA_VIDA_FERIMENTO.map(item => (
                    <tr key={item.nivel}><th>Nível {item.nivel}</th><td>{item.recuperacao}</td><td>{item.ferimento}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rules-reference__compact-list">
              <p><strong>Potência:</strong> recuperar PV é exceção específica; a quantidade da tabela não aumenta por Passos.</p>
              <p><strong>Condições:</strong> recuperar PV não remove automaticamente veneno, doença ou outra Condição.</p>
              <p><strong>Morte:</strong> Vida 4 pode preservar/restaurar funções vitais de alguém vivo, mas não reverte uma morte determinada pelo Movimento de Morte. Vida 5 pode restaurar alguém morto; em sucesso, retorna com 1 PV.</p>
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
            <p className="ro-eyebrow">Descanso</p>
            <h3>8 horas de sono · 2 Movimentos de Descanso</h3>
            <div className="rules-reference__compact-list">
              <p><strong>Ancoragem:</strong> passar tempo com ela concede 1 Movimento adicional.</p>
              <p><strong>Cicatrização:</strong> recupere todos os PV.</p>
              <p><strong>Remover Condição:</strong> remova uma Condição apropriada.</p>
              <p><strong>Restaurar Proteção:</strong> recupere todos os PO.</p>
              <p><strong>Restaurar Ruptura:</strong> a trilha volta a 0.</p>
              <p><strong>Recuperar Foco:</strong> recupere todos os PF gastos.</p>
              <p><strong>Projeto Pessoal:</strong> investigue, aprenda, construa ou crie algo ligado aos seus objetivos.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Contadores</p>
            <h3>Processos, pressão, perseguições e conflitos em etapas</h3>
            <p>Defina valor inicial, objetivo, direção e gatilhos. Quando o Sonhar participa: Convergência progride 2 e −1 Ruptura; Realidade vence recua 1; Sonhar vence progride 1 e +1 Ruptura; Divergência recua 2 e +2 Ruptura, quando recuar fizer sentido.</p>
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
