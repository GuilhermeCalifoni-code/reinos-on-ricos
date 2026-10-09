import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sheet=readFileSync('src/components/CharacterSheet.tsx','utf8');
const app=readFileSync('src/App.tsx','utf8');
const mesa=readFileSync('src/components/live/LiveTable.tsx','utf8');
const campaign=readFileSync('src/components/CampaignDetailView.tsx','utf8');
const index=readFileSync('src/index.css','utf8');
const styles=readFileSync('src/design-system/desvelado-sheet-light.css','utf8');

test('Toda abertura de Desvelado reutiliza CharacterSheet, não o modal de criação',()=>{
  assert.ok(app.includes("React.lazy(() => import('./components/CharacterSheet')"));
  assert.match(app,/<CharacterSheet\s+personagem=\{personagemParaFicha\}/);
  assert.match(mesa,/onAbrirFicha=\{onAbrirFicha\}/);
  assert.match(campaign,/onAbrirFichaPersonagem/);
});
test('Ficha real é formulário contínuo, sem abas legadas',()=>{
  assert.match(sheet,/className="ro-sheet"/);
  for (const heading of ['Atributos','Combate e resistência','Domínios do Sonhar','Ancoragem e vínculos','Recursos e equipamentos']) {
    assert.ok(sheet.includes(heading),heading);
  }
  assert.doesNotMatch(sheet,/paginaAtiva|setPaginaAtiva|Ficha 1\/2|Ficha 2\/2/);
  assert.doesNotMatch(sheet,/bg-slate-950|border-cyan-500|Chakra_Petch/);
});
test('Ficha mantém controles de recursos, Ruptura, Dano e Descanso',()=>{
  assert.match(sheet,/vidaAtual/);
  assert.match(sheet,/focoAtual/);
  assert.match(sheet,/protecaoOniricaAtual/);
  assert.match(sheet,/calcularDefesa\(personagem\.atributoPrincipal,atributos,personagem\.nivel\)/);
  assert.match(sheet,/calcularResistencia\(atributos\.corpo\)/);
  assert.match(sheet,/<RupturaModal personagem=\{personagem\}/);
  assert.match(sheet,/<DamageModal personagem=\{personagem\}/);
  assert.match(sheet,/<RestModal personagem=\{personagem\}/);
  assert.match(sheet,/onDispararMovimentoMorte/);
});
test('Domínios e níveis usam progressão existente e limites oficiais',()=>{
  assert.match(sheet,/TABELA_PROGRESSAO\[personagem\.nivel\]/);
  assert.ok(sheet.includes('validarDistribuicaoDominios(personagem.dominios, personagem.nivel)'));
  assert.match(sheet,/personagem\.nivel===5 && value===5/);
  assert.match(sheet,/n>prog\.dominioMaximo/);
  assert.match(sheet,/atualizadoEm:new Date\(\)\.toISOString\(\)/);
});
test('Ações de ficha e dados existentes são preservados sem novas tabelas',()=>{
  for(const marker of ['onExportar(personagem)','onDuplicar(personagem.id)','onExcluir(personagem.id)','onIrParaRolador(personagem,key)','onIrParaGuiaSonhar(personagem)','personagem.ancoragem','personagem.vinculos','personagem.recursos','personagem.equipamentos','anotacoesGerais','percepcaoOniricaNotas']) {
    assert.ok(sheet.includes(marker),marker);
  }
});
test('Tema claro isolado da Mesa Ao Vivo e responsivo',()=>{
  assert.match(index,/desvelado-sheet-light\.css/);
  assert.match(styles,/\.ro-sheet \{/);
  assert.match(styles,/--sh-paper:#faf8f3/);
  assert.match(styles,/@media\(max-width:850px\)/);
  assert.match(styles,/@media\(max-width:600px\)/);
  assert.match(styles,/\.ro-sheet__resource-grid/);
});
