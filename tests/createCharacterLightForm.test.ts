import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularDefesa, calcularVidaMaxima, validarDistribuicaoDominios } from '../src/rules/rulesEngine';

const form=readFileSync('src/components/CreateCharacterModal.tsx','utf8');
const css=readFileSync('src/design-system/create-character-light.css','utf8');
const entry=readFileSync('src/index.css','utf8');

// Desde 05/11 (T1B) a criação é em passos, a pedido do Guilherme: diagnóstico C2–C9.
test('criação em 6 passos, num único formulário, e só avança com o passo completo',()=>{
  assert.equal((form.match(/<form\b/g)||[]).length,1);
  assert.match(form,/const PASSOS = \['Identidade', 'Conceito', 'Atributos', 'Sonhar', 'Ancoragem', 'Revisão'\] as const;/);
  for(const section of ['Identidade','Retrato','Conceito','Atributos','Domínios do Sonhar','Ancoragem','Revisão']){
    assert.ok(form.includes(section), 'seção ausente: '+section);
  }
  assert.match(form,/id="ro-create-character-form"/);
  assert.match(form,/type="submit" form="ro-create-character-form"/);
  assert.match(form,/disabled=\{pendenciasPasso\.length > 0\}/);
  assert.match(form,/Para continuar, falta:/);
});

test('nada vem escolhido, os Conceitos trazem o texto do livro e os números aparecem uma vez',()=>{
  assert.match(form,/useState<Conceito \| null>\(null\)/);
  assert.match(form,/Impõe sua vontade/);
  assert.match(form,/Imaginou outro caminho/);
  assert.match(form,/Procurou compreender/);
  assert.match(form,/Permitiu-se sentir/);
  assert.doesNotMatch(form,/ro-character-create-preview-vitals/); // sem a prévia repetida (C4)
  assert.doesNotMatch(form,/label:'Ruptura'/);                    // Ruptura não é escolha do jogador (C9)
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
