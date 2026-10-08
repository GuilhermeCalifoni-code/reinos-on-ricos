import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularDefesa, calcularVidaMaxima, validarDistribuicaoDominios } from '../src/rules/rulesEngine';

const form=readFileSync('src/components/CreateCharacterModal.tsx','utf8');
const css=readFileSync('src/design-system/create-character-light.css','utf8');
const entry=readFileSync('src/index.css','utf8');

test('criador tem formulário único sem abas e com todas as etapas visíveis',()=>{
  assert.equal((form.match(/<form\b/g)||[]).length,1);
  for(const section of ['Identidade','Retrato','Atributos','Estatísticas','Domínios do Sonhar','Ancoragem']){
    assert.ok(form.includes(section), 'seção ausente: '+section);
  }
  assert.match(form,/id="ro-create-character-form"/);
  assert.match(form,/type="submit" form="ro-create-character-form"/);
  assert.doesNotMatch(form,/activeTab|abaAtiva|tabindex|role="tablist"/);
});

test('prévia atualiza atributos, pontos e retrato sem gravar ficha parcial',()=>{
  assert.match(form,/ro-character-create-preview-portrait/);
  assert.match(form,/ro-character-create-preview-vitals/);
  assert.match(form,/ro-character-create-preview-domains/);
  assert.match(form,/ro-character-create-preview-anchor/);
  assert.match(form,/validarDistribuicaoDominios\(dominios, nivel\)/);
  assert.match(form,/disabled=\{!fichaValida \|\| salvando\}/);
});

test('modo claro aplica uma folha responsiva, não o modal escuro anterior',()=>{
  assert.match(entry,/create-character-light\.css/);
  assert.match(css,/\.ro-character-create-dialog\s*\{/);
  assert.match(css,/#faf8f3/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(max-width:480px\)/);
  assert.doesNotMatch(form,/bg-\[#11141c\]|bg-black\/80|font-mono text-xs/);
});

test('cálculos oficiais continuam sendo usados, sem mudança mecânica',()=>{
  assert.equal(calcularDefesa('mente',{corpo:2,mente:1,vontade:0,vinculo:-1},1).defesa,10);
  assert.equal(calcularVidaMaxima(1),4);
  const invalid=validarDistribuicaoDominios({consciencia:5,espaco:0,fluxo:0,substancia:0,vida:0},1);
  assert.equal(invalid.valida,false);
  assert.match(form,/calcularDefesa\(atributoPrincipal, atributos, nivel\)/);
});
