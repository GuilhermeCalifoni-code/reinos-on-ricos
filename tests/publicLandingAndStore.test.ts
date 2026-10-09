import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const landing=readFileSync('src/components/PublicLanding.tsx','utf8');
const app=readFileSync('src/App.tsx','utf8');
const login=readFileSync('src/components/LoginScreen.tsx','utf8');
const css=readFileSync('src/design-system/public-landing.css','utf8');
const entry=readFileSync('src/index.css','utf8');

test('visitantes veem apresentação antes de autenticar, usuários autenticados seguem ao painel',()=>{
  assert.match(app,/if \(!session\) \{/);
  assert.match(app,/return <PublicLanding/);
  assert.match(app,/if \(showLogin\) return <LoginScreen/);
  assert.match(app,/screen=\{publicScreen\}/);
  assert.match(app,/onRegister=\{\(\) => \{ setAuthEntryMode\('cadastro'\)/);
  assert.match(login,/initialMode\?: 'entrar' \| 'cadastro'/);
  assert.match(app,/onBack=\{\(\) => setShowLogin\(false\)\}/);
});

test('logo da landing corresponde ao arquivo usado pelo LoginScreen real',()=>{
  assert.match(landing,/src="\/ro-login-logo.webp"/);
  assert.match(login,/className="login-onirico__brand-lockup" src="\/ro-login-logo.webp"/);
});

test('oferece combo e ambos volumes, sem inventar valores ou receber pagamento',()=>{
  for(const x of ['Livro Básico','Livro de Adversários','Coleção completa','Preço a definir','Compra indisponível no momento']) {
    assert.ok(landing.includes(x),x);
  }
  assert.match(landing,/aria-checked=\{selection===id\}/);
  assert.match(landing,/onScreenChange\('store',choice\)/);
  assert.match(landing,/disabled className="ro-public-button/);
  assert.doesNotMatch(landing,/payment_intent|checkout\.sessions|MercadoPago|stripe|PIX|chavePix/);
});

test('autoria do RPG e desenvolvimento da plataforma são atribuições distintas',()=>{
  assert.match(landing,/Criador do Reinos Oníricos RPG/);
  assert.match(landing,/Responsável pela concepção do universo, criação do sistema/);
  assert.match(landing,/Cofundador do projeto, responsável pela criação e desenvolvimento da plataforma web/);
  assert.match(landing,/Colabora na revisão dos livros/);
});

test('layout público é isolado, claro e responsivo',()=>{
  assert.match(entry,/design-system\/public-landing\.css/);
  assert.match(css,/\.ro-public\s*\{/);
  assert.match(css,/--pub-bg:#f8f5ef/);
  assert.match(css,/@media\(max-width:780px\)/);
  assert.match(css,/@media\(max-width:520px\)/);
  assert.match(css,/\.ro-public-store__grid/);
});
