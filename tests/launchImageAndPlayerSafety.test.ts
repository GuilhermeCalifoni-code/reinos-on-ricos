import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test('a identidade visual usa o ícone real do projeto como favicon', () => {
  assert.match(read('index.html'), /rel="icon" type="image\/svg\+xml" href="\/ro-mark\.svg"/);
});

test('dashboard mostra retratos reais de personagens e avatar de perfil com fallback', () => {
  const dashboard = read('src/components/DashboardView.tsx');
  assert.match(dashboard, /personagem\.imagemUrl\s*\?\s*<AssetImage src=\{personagem\.imagemUrl\}/);
  assert.match(dashboard, /className="ro-home__character-photo"/);
  assert.match(dashboard, /<AssetImage src=\{avatarUrl\} fallbackSrc="\/ro-mark\.svg"/);
  const css = read('src/design-system/dashboard-reference.css');
  assert.match(css, /\.ro-home__character-avatar\.has-photo::before/);
  assert.match(css, /\.ro-home__character-photo/);
});

test('Mesa usa o avatar da conta e não seleciona personagem de outro jogador', () => {
  const app = read('src/App.tsx');
  const mesa = read('src/components/MesaView.tsx');
  const live = read('src/components/live/LiveTable.tsx');
  assert.match(app, /avatarUrl=\{session\.avatarUrl\}/);
  assert.match(mesa, /avatarUrl=\{avatarUrl\}/);
  assert.match(live, /<AssetImage src=\{avatarUrl\} fallbackSrc="\/ro-mark\.svg"/);
  assert.match(live, /const selecionado = personagensVisiveis\.find/);
  assert.doesNotMatch(live, /const selecionado = personagens\.find/);
  assert.doesNotMatch(live, /useState\(personagensVisiveis\[0\]\?\.id \|\| personagens\[0\]/);
});

test('imagens privadas renovam URLs assinadas e param de tentar quando falham', () => {
  const asset = read('src/components/system/AssetImage.tsx');
  assert.match(asset, /SIGNED_URL_REFRESH_MS = 50 \* 60 \* 1000/);
  assert.match(asset, /window\.setInterval/);
  assert.match(asset, /window\.clearInterval/);
  assert.match(asset, /retriedRef\.current/);
  assert.match(asset, /campaignAssetService\.resolveImageRef\(src\)/);
});

test('somente proprietário pode trocar retrato da ficha existente', () => {
  const app = read('src/App.tsx');
  const sheet = read('src/components/CharacterSheet.tsx');
  assert.match(app, /onAlterarRetrato=\{personagemParaFicha\.ownerUserId === session\.authUserId/);
  assert.match(app, /campaignAssetService\.uploadCharacterPortrait\(atual\.id, file\)/);
  assert.match(sheet, /type="file" accept="image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.match(sheet, /enviandoRetrato/);
  assert.match(sheet, /role="alert" className="ro-sheet__portrait-error"/);
});
