import React, { useMemo, useState } from 'react';
import { DESCRICAO_DOMINIOS, DISTANCIAS_REINOS_ONIRICOS, LINGUAGEM_DOMINIOS, TABELA_PROGRESSAO } from '../rules/rulesData';
import {
  ALCANCE_SONHAR_POR_NIVEL,
  AREA_DISTANCIA_DANO,
  DIFICULDADE_ADVERSARIO,
  DT_SONHAR_ATIVO,
  DURACAO_SONHAR_POR_NIVEL,
  INTENSIDADE_DANO,
  MATERIAIS_ESTRUTURA,
  PASSOS_POTENCIA_POR_NIVEL,
  PERIGO_ADVERSARIO,
  REGRAS_PASSOS_POTENCIA,
  RESISTENCIA_ADVERSARIO,
  RESISTENCIA_ESTRUTURAS,
  TAMANHOS_OBJETO,
  VIDA_ADVERSARIO_POR_NA,
  VIDA_CURA_FERIMENTO,
  MaterialEstrutural,
  TamanhoEstrutural,
  resolverDanoEstrutura
} from '../rules/referenceTables';

type Secao = 'testes' | 'sonhar' | 'potencia' | 'estruturas' | 'vida' | 'combate' | 'sobrevivencia' | 'adversarios' | 'mesa';

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
          <p className="ro-eyebrow">Referência de mesa · VF5</p>
          <h2>Regras essenciais</h2>
        </div>
        <p>Consulta operacional do Livro Básico para conduzir a sessão sem interromper o ritmo da mesa.</p>
      </header>

      <nav className="rules-reference__tabs" aria-label="Seções de regras">
        <Tab active={secao === 'testes'} onClick={() => setSecao('testes')}>Testes</Tab>
        <Tab active={secao === 'sonhar'} onClick={() => setSecao('sonhar')}>Sonhar</Tab>
        <Tab active={secao === 'potencia'} onClick={() => setSecao('potencia')}>Potência</Tab>
        <Tab active={secao === 'estruturas'} onClick={() => setSecao('estruturas')}>Objetos</Tab>
        <Tab active={secao === 'vida'} onClick={() => setSecao('vida')}>Vida</Tab>
        <Tab active={secao === 'combate'} onClick={() => setSecao('combate')}>Tensão</Tab>
        <Tab active={secao === 'sobrevivencia'} onClick={() => setSecao('sobrevivencia')}>Dano & Morte</Tab>
        <Tab active={secao === 'adversarios'} onClick={() => setSecao('adversarios')}>Adversários</Tab>
        <Tab active={secao === 'mesa'} onClick={() => setSecao('mesa')}>Mesa</Tab>
      </nav>

      {secao === 'testes' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Teste Mundano</p>
            <h3>1d20 + Atributo ≥ DT</h3>
            <p>Role quando houver incerteza relevante e consequência interessante. Foco pode ser gasto antes do Teste: no máximo 1 PF para +2. Um 20 natural é sucesso automático; se a ação causar dano, o dano é crítico.</p>
            <div className="rules-reference__grid rules-reference__grid--dt">
              {[[8,'Trivial'],[10,'Fácil'],[12,'Comum'],[14,'Desafiador'],[16,'Difícil'],[18,'Muito difícil'],[20,'Extraordinário'],['>20','Onírico']].map(([dt,nome]) => <span key={String(dt)}><strong>{dt}</strong>{nome}</span>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Teste Reflexo</p>
            <h3>Teste Mundano em resposta a um gatilho</h3>
            <p>O Mestre escolhe Atributo e DT pela narrativa. Foco, Vantagem e Desvantagem funcionam normalmente. Uma Condição pode impedir a reação quando sua causa tornar a resposta impossível.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Teste Onírico</p>
            <h3>Realidade + Sonhar · cada dado contra a mesma DT</h3>
            <p>Role 2d20 + o mesmo Atributo apropriado. A DT é normalmente 13 e não usa a escala Mundana. Até 1 PF pode conceder +2 ao Teste, aplicado aos dois resultados. Testes Oníricos nunca recebem Vantagem ou Desvantagem.</p>
            <div className="rules-reference__outcomes">
              <div><strong>Convergência</strong><span>ambos passam</span><p>Manifestação acontece; crítico; Ruptura −1.</p></div>
              <div><strong>Realidade vence</strong><span>só Realidade passa</span><p>Manifestação não acontece; Ruptura 0.</p></div>
              <div><strong>Sonhar vence</strong><span>só Sonhar passa</span><p>Manifestação acontece; Ruptura +1.</p></div>
              <div><strong>Divergência</strong><span>ambos falham</span><p>Manifestação não acontece; Ruptura +2.</p></div>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Crítico</p>
            <h3>Máximo do dado + nova rolagem + modificador</h3>
            <p>Em Teste Mundano, o crítico acontece no 20 natural. No Teste Onírico, Convergência é o crítico. Se houver dano, use o valor máximo do dado, role o mesmo dado novamente e some o modificador aplicável.</p>
          </article>
        </div>
      )}

      {secao === 'sonhar' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Princípio</p>
            <h3>O Sonhar trabalha com possibilidades, não uma lista de poderes</h3>
            <p>O Jogador determina a intenção; o Domínio determina a possibilidade; o nível efetivamente utilizado determina profundidade, alcance, duração e Potência; a narrativa determina a forma; o Teste Onírico determina o encontro entre Sonhar e Realidade.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Linguagem dos níveis</p>
            <div className="rules-reference__levels">
              {LINGUAGEM_DOMINIOS.map(item => <div key={item.nivel}><strong>{item.nivel}</strong><span>{item.verbo}</span><p>{item.descricao}</p></div>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Percepção Onírica</p>
            <h3>Nível 1 percebe e interpreta o que já está presente</h3>
            <p>Perceber ou interpretar uma anomalia presente não exige Teste Onírico. A Percepção não é onisciência: não revela automaticamente origem, ficha, fraqueza, passado, futuro ou tudo atrás de obstáculos. Interferir, revelar ativamente algo oculto ou alterar a Realidade volta a exigir manifestação.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Alcance & Duração</p>
            <div className="rules-reference__power-levels">
              {ALCANCE_SONHAR_POR_NIVEL.map((item, index) => (
                <div key={item.nivel}>
                  <span>Nível {item.nivel}</span>
                  <strong>{item.alcance}</strong>
                  <small>{DURACAO_SONHAR_POR_NIVEL[index].duracao}{item.requerEspaco ? ' · alcance nessa faixa requer Espaço do mesmo nível' : ''}</small>
                </div>
              ))}
            </div>
            <p className="rules-reference__after-grid">Por padrão uma manifestação possui um único alvo. Múltiplos alvos individuais exigem Área. Duração sustenta a alteração; não apaga consequências que já passaram a existir normalmente na Realidade.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Efeitos ativos</p>
            <h3>A manifestação acontece primeiro</h3>
            <div className="rules-reference__grid rules-reference__grid--dt">
              {Object.entries(DT_SONHAR_ATIVO).map(([nivel, dt]) => <span key={nivel}><strong>{dt}</strong>Nível {nivel}</span>)}
            </div>
            <div className="rules-reference__compact-list">
              <p><strong>Quando testar:</strong> somente quando alguém tentar agir diretamente contra algo que a manifestação tornou difícil.</p>
              <p><strong>Sucesso:</strong> permite agir contra a manifestação naquela tentativa; não a dissipa automaticamente.</p>
              <p><strong>Falha em Movimento:</strong> impede o deslocamento, mas não consome automaticamente a Ação.</p>
              <p><strong>Falha em Ação:</strong> impede a Ação e ela é considerada utilizada.</p>
              <p><strong>Múltiplas manifestações:</strong> faça um único teste contra a maior DT aplicável.</p>
              <p><strong>Pesadelo:</strong> para confrontar manifestação ativa, pode rolar 1d20 + NA contra a DT do Sonhar. Esse bônus não se aplica automaticamente a ataques.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Guia do Sonhar</p>
            <h3>Fluxo de uma manifestação</h3>
            <p>Intenção → Domínio → Nível → Combinação? → Alcance → Alvos/Área → Duração → Complexidade → Dano/Potência → Atributo → Teste → Manifestação → Ruptura/Delírio → Consequências.</p>
            <div className="rules-reference__compact-list">
              <p><strong>Combinação:</strong> Domínio Principal deve possuir nível pelo menos 1 maior que cada secundário; níveis não são somados; Potência usa o maior nível combinado.</p>
              <p><strong>Tentativas sucessivas:</strong> depois de uma falha, não repita a mesma tentativa até conseguir. Alvo, circunstância, abordagem, uso do Domínio ou outro elemento relevante precisa mudar.</p>
              <p><strong>Condição:</strong> se dificultar significativamente a manifestação, +2 DT; se tornar algo indispensável impossível, aquela manifestação não pode ser realizada. Aumentos por Condições não acumulam.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Domínios</p>
            <div className="rules-reference__domains">
              {Object.values(DESCRICAO_DOMINIOS).map(dominio => <div key={dominio.nome}><h4>{dominio.nome}</h4><p>{dominio.tema}</p><small>{dominio.manifestacoesTipicas}</small></div>)}
            </div>
          </article>
        </div>
      )}

      {secao === 'potencia' && (
        <div className="rules-reference__content">
          <article className="ro-surface rules-reference__feature">
            <p className="ro-eyebrow">Potência do Sonhar</p>
            <h3>Nível responde “o que é possível?”. Potência responde “quanto uma característica é afetada?”.</h3>
            <p>Escolha uma única característica mecânica da manifestação e aplique nela todos os Passos disponíveis. Passos não são pontos que podem ser distribuídos entre vários benefícios.</p>
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
            <p className="ro-eyebrow">Regras centrais</p>
            <div className="rules-reference__compact-list">
              <p><strong>Uma característica:</strong> todos os Passos disponíveis vão para ela.</p>
              <p><strong>Consequências naturais:</strong> uma mudança pode causar várias repercussões coerentes sem “pagar” um Passo por cada consequência.</p>
              <p><strong>Dano:</strong> d4 → d6 → d8 → d10 → d12. d20 é excepcional e ligado a fenômenos Oníricos poderosos ou Sonhar 5.</p>
              <p><strong>Tamanho:</strong> a implementação usa Pequeno como base, conforme a regra detalhada de Potência e a seção de Objetos e Estruturas.</p>
            </div>
          </article>
        </div>
      )}

      {secao === 'estruturas' && (
        <div className="rules-reference__content">
          <article className="ro-surface rules-reference__feature">
            <p className="ro-eyebrow">Objetos & Estruturas</p>
            <h3>Objetos não precisam de PV</h3>
            <p>Dano ≤ R: resiste. Dano &gt; R: quebra, perfura, rompe ou é destruído conforme a ação. Cada ocorrência é comparada separadamente e dano inferior não se acumula, salvo deterioração persistente justificada.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Resistência estrutural</p>
            <div className="rules-reference__table-wrap">
              <table className="rules-reference__matrix">
                <thead><tr><th>Material</th><th>Pequeno</th><th>Médio</th><th>Grande</th><th>Imenso</th></tr></thead>
                <tbody>
                  {MATERIAIS_ESTRUTURA.map(item => (
                    <tr key={item.id}><th>{item.nome}</th><td>{RESISTENCIA_ESTRUTURAS[item.id].pequeno}</td><td>{RESISTENCIA_ESTRUTURAS[item.id].medio}</td><td>{RESISTENCIA_ESTRUTURAS[item.id].grande}</td><td>{RESISTENCIA_ESTRUTURAS[item.id].imenso}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rules-reference__material-notes">{MATERIAIS_ESTRUTURA.map(item => <p key={item.id}><strong>{item.nome}:</strong> {item.exemplos}</p>)}</div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Tamanho de objetos</p>
            <div className="rules-reference__sizes">
              {TAMANHOS_OBJETO.map(item => <div key={item.id}><strong>{item.nome}</strong><p>{item.exemplos}</p></div>)}
            </div>
            <p className="rules-reference__after-grid">Tamanho representa quanto material precisa ser comprometido para o efeito, não necessariamente o tamanho total da construção.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Teste rápido de estrutura</p>
            <div className="rules-reference__structure-tool">
              <label><span>Material</span><select value={material} onChange={event => setMaterial(event.target.value as MaterialEstrutural)}>{MATERIAIS_ESTRUTURA.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
              <label><span>Tamanho</span><select value={tamanho} onChange={event => setTamanho(event.target.value as TamanhoEstrutural)}><option value="pequeno">Pequeno</option><option value="medio">Médio</option><option value="grande">Grande</option><option value="imenso">Imenso</option></select></label>
              <label><span>Dano</span><input type="number" min={0} value={danoEstrutura} onChange={event => setDanoEstrutura(Math.max(0, Number(event.target.value) || 0))} /></label>
              <div className={resultadoEstrutura.rompe ? 'rules-reference__structure-result is-broken' : 'rules-reference__structure-result'}><span>R {resultadoEstrutura.resistencia}</span><strong>{resultadoEstrutura.rompe ? 'ROMPE / QUEBRA' : 'RESISTE'}</strong></div>
            </div>
            <p className="rules-reference__warning">A fonte de dano precisa ser capaz, pela ficção, de afetar aquele material. Um soco comum não rompe concreto maciço só porque a rolagem foi alta.</p>
          </article>
        </div>
      )}

      {secao === 'vida' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Vida · Cura & Ferimento</p>
            <h3>A alteração biológica precisa explicar o efeito</h3>
            <p>Recuperar ou retirar PV não substitui a avaliação do nível de Vida utilizado. Cura não aumenta por Passos de Potência e Convergência não aumenta automaticamente a quantidade curada.</p>
            <div className="rules-reference__table-wrap">
              <table className="rules-reference__matrix">
                <thead><tr><th>Nível</th><th>Recuperação</th><th>Ferimento</th></tr></thead>
                <tbody>{VIDA_CURA_FERIMENTO.map(item => <tr key={item.nivel}><th>{item.nivel}</th><td>{item.recuperacao}</td><td>{item.ferimento}</td></tr>)}</tbody>
              </table>
            </div>
          </article>
          <article className="ro-surface">
            <p className="ro-eyebrow">Limites</p>
            <div className="rules-reference__compact-list">
              <p><strong>Condições:</strong> recuperar PV não remove automaticamente veneno, doença ou outra Condição; trate a causa com nível adequado.</p>
              <p><strong>Ferimento com Vida:</strong> use as regras de dano e Resistência; descrições extremas não ignoram R ou PV.</p>
              <p><strong>Vida 4:</strong> pode preservar/restaurar funções vitais de alguém ainda vivo, mas não reverte morte determinada pelo Movimento de Morte.</p>
              <p><strong>Vida 5:</strong> pode restaurar alguém morto; em sucesso retorna com 1 PV. Estado do corpo, tempo e circunstâncias podem exigir outros Domínios.</p>
            </div>
          </article>
        </div>
      )}

      {secao === 'combate' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Cena de Tensão</p>
            <h3>Não há iniciativa</h3>
            <p>Os Jogadores escolhem a ordem e os Turnos alternam Jogador e Mestre. A Rodada termina quando todos os Jogadores tiveram uma ativação. Mais Adversários não concedem automaticamente mais Ações ao Mestre.</p>
          </article>
          <article className="ro-surface">
            <p className="ro-eyebrow">Movimento</p>
            <p>Movimento integra a Ação e pode ser dividido antes e depois dela. Deslocamento base: Próximo. Correr exige Teste Reflexo de Corpo DT 15 ou mais; sucesso duplica o Deslocamento na Ação. Interações simples, como abrir uma porta, pegar um objeto, sacar uma arma ou ligar uma lanterna, integram o Movimento.</p>
          </article>
          <article className="ro-surface">
            <p className="ro-eyebrow">Ações</p>
            <div className="rules-reference__compact-list">
              <p><strong>Ataque:</strong> Teste Mundano contra Dificuldade do Adversário ou Defesa de Personagem.</p>
              <p><strong>Agarrar/Derrubar/Imobilizar:</strong> Teste Mundano de Corpo; sucesso pode impor Condição apropriada.</p>
              <p><strong>Sonhar:</strong> Teste Onírico.</p>
              <p><strong>Ataque + Sonhar:</strong> uma única Ação e um único Teste Onírico; DT = maior entre 13 e a Dificuldade do alvo. O Teste Onírico resolve ataque e manifestação.</p>
              <p><strong>Ajudar:</strong> Vantagem no próximo Teste Mundano beneficiado; para ajudar Sonhar, gaste a Ação e reduza a DT Onírica do aliado em 2.</p>
              <p><strong>Neutralização:</strong> não há Teste específico. Se as consequências retiram efetivamente a oposição da Cena, o Adversário pode ser Neutralizado sem chegar a 0 PV.</p>
            </div>
          </article>
        </div>
      )}

      {secao === 'sobrevivencia' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Valores essenciais</p>
            <div className="rules-reference__stats"><span><strong>R</strong>6 + Corpo</span><span><strong>Defesa</strong>8 + Corpo</span><span><strong>PO</strong>2</span><span><strong>Ruptura</strong>0 a 6</span></div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Intensidade de dano</p>
            <div className="rules-reference__power-table">{INTENSIDADE_DANO.map(item => <div key={item.dado}><strong>{item.dado} · {item.intensidade}</strong><p>{item.referencia}</p><small>{item.exemplos}</small></div>)}</div>
            <p className="rules-reference__after-grid">Dano produzido ou manipulado diretamente pelo Sonhar soma o nível do Desvelado ao resultado. Dano contínuo repete o mesmo dado ao final de cada Rodada enquanto a exposição continuar.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Área & Distância de dano</p>
            <div className="rules-reference__table-wrap">
              <table className="rules-reference__matrix">
                <thead><tr><th>Fonte</th><th>Área</th><th>Distância máxima</th><th>Exemplo</th></tr></thead>
                <tbody>{AREA_DISTANCIA_DANO.map(item => <tr key={item.tipo}><th>{item.tipo}</th><td>{item.area}</td><td>{item.distancia}</td><td>{item.exemplo}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="rules-reference__after-grid">Em Área, faça um único ataque contra a maior Defesa/Dificuldade dos alvos, role o dano uma vez e aplique o mesmo resultado aos atingidos.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Converter dano em PV</p>
            <div className="rules-reference__compact-list">
              <p><strong>Dano ≤ R:</strong> perde 1 PV.</p>
              <p><strong>Dano &gt; R:</strong> perde 2 PV.</p>
              <p><strong>Dano Massivo opcional:</strong> dano &gt; 2 × R causa perda de 3 PV.</p>
              <p><strong>PO:</strong> depois da comparação, gaste no máximo 1 PO para reduzir a perda em 1 PV.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Movimento de Morte</p>
            <h3>0 PV → 2d20 sem Atributo contra DT 13</h3>
            <div className="rules-reference__compact-list">
              <p><strong>Convergência:</strong> recupere 2 PV e fique consciente.</p>
              <p><strong>Realidade vence:</strong> estabilize; permaneça inconsciente com 0 PV e precise de cuidados ou Descanso.</p>
              <p><strong>Sonhar vence:</strong> recupere 1 PV, +2 Ruptura e fique consciente.</p>
              <p><strong>Divergência:</strong> o Personagem morre.</p>
            </div>
          </article>
        </div>
      )}

      {secao === 'adversarios' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Ficha mínima</p>
            <h3>Dificuldade · Vida · Resistência · NA · Habilidades</h3>
            <p>Passivas são sempre presentes; Ações descrevem o que fazem, alvo, alcance, teste, dano e consequências; Reações exigem gatilho claro e, salvo indicação contrária, cada Reação pode ser usada uma vez por Rodada.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Nível de Ameaça & Vida</p>
            <div className="rules-reference__grid rules-reference__grid--dt">
              {Object.entries(VIDA_ADVERSARIO_POR_NA).map(([na, vida]) => <span key={na}><strong>{vida} PV</strong>NA {na}</span>)}
            </div>
            <p className="rules-reference__after-grid">Quando o dano de uma Ação escala com NA, use o dado do Nível de Perigo + NA. O NA não é somado automaticamente à rolagem de ataque.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Referências rápidas</p>
            <div className="rules-reference__power-table">
              <div><strong>Dificuldade</strong>{DIFICULDADE_ADVERSARIO.map(item => <p key={item.nome}>{item.nome}: {item.valor}</p>)}</div>
              <div><strong>Resistência</strong>{RESISTENCIA_ADVERSARIO.map(item => <p key={item.nome}>{item.nome}: {item.valor}</p>)}</div>
              <div><strong>Nível de Perigo</strong>{PERIGO_ADVERSARIO.map(item => <p key={item.nome}>{item.nome}: {item.dado}</p>)}</div>
            </div>
          </article>
        </div>
      )}

      {secao === 'mesa' && (
        <div className="rules-reference__content">
          <article className="ro-surface">
            <p className="ro-eyebrow">Progressão</p>
            <div className="rules-reference__progression">
              {Object.values(TABELA_PROGRESSAO).map(nivel => <div key={nivel.nivel}><strong>Nível {nivel.nivel}</strong><span>{nivel.vidaBase} PV · {nivel.focoBase} PF · {nivel.protecaoOniricaBase} PO</span><small>{nivel.pontosDeSonhar} Pontos de Sonhar · Domínio máx. {nivel.dominioMaximo}</small></div>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Descanso</p>
            <h3>≈ 8 horas · 2 Movimentos + 1 com Ancoragem</h3>
            <div className="rules-reference__compact-list">
              <p>Cicatrização: recupere todos os PV.</p><p>Remover Condição apropriada.</p><p>Restaurar PO.</p><p>Restaurar Ruptura: volta a 0.</p><p>Recuperar Foco.</p><p>Projeto Pessoal.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Condições</p>
            <div className="rules-reference__compact-list">
              <p><strong>Oculto:</strong> ações dependentes de localizar/perceber sofrem Desvantagem se for difícil; se impossível, não podem ser realizadas.</p>
              <p><strong>Impedido:</strong> se a limitação torna uma ação impossível, ela não ocorre; se só dificulta significativamente, Teste Mundano sofre Desvantagem.</p>
              <p><strong>Vulnerável:</strong> Testes Mundanos próprios podem sofrer Desvantagem; ações contra o alvo podem receber Vantagem quando exploram a fraqueza.</p>
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Distâncias</p>
            <div className="rules-reference__power-table">
              {Object.values(DISTANCIAS_REINOS_ONIRICOS).map(item => <div key={item.nome}><strong>{item.nome}</strong><p>{item.descricao}</p><small>{item.exemplos}</small></div>)}
            </div>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Contadores</p>
            <p>Defina valor inicial, objetivo, direção e gatilhos. Quando o Sonhar participa: Convergência progride 1 e −1 Ruptura; Realidade vence recua 1; Sonhar vence progride 1 e +1 Ruptura; Divergência recua 2 e +2 Ruptura, quando recuar fizer sentido.</p>
          </article>

          <article className="ro-surface">
            <p className="ro-eyebrow">Ruptura & Delírio</p>
            <p>Ao alcançar 6, resolva primeiro a manifestação, crie um Efeito de Ruptura coerente e retorne a trilha a 0. Delírio Moderado ou Intenso causa +1 Ruptura a todos os Desvelados presentes; a quantidade de testemunhas não multiplica o efeito. Fotografias, vídeos e transmissões não provocam Delírio por si.</p>
          </article>
        </div>
      )}
    </section>
  );
};
