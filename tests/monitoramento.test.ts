import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mon = readFileSync('src/lib/monitoramento.ts', 'utf8');

test('Sentry: desligado no computador local, ligado em produção e nos previews', () => {
  assert.match(mon, /host === 'localhost' \|\| host === '127\.0\.0\.1'/);
  assert.match(mon, /ehLocal\(window\.location\.hostname\)\) return;/);
});

test('Sentry: só o id do usuário vai junto, nunca e-mail ou nome', () => {
  assert.match(mon, /event\.user = event\.user\.id \? \{ id: event\.user\.id \} : undefined/);
  const app = readFileSync('src/App.tsx', 'utf8');
  assert.match(app, /identificarUsuario\(restaurada\.authUserId\)/);
  assert.match(app, /identificarUsuario\(null\)/);
});

test('Sentry: iniciado antes da tela e avisado quando a tela quebra', () => {
  assert.match(readFileSync('src/main.tsx', 'utf8'), /iniciarMonitoramento\(\);\n/);
  assert.match(readFileSync('src/components/system/AppErrorBoundary.tsx', 'utf8'), /registrarErroDaTela\(error, info\.componentStack\)/);
});

test('Sentry: ?teste-sentry manda um erro de teste sem quebrar a tela', () => {
  assert.match(mon, /has\('teste-sentry'\)/);
  assert.match(mon, /Sentry\.captureException\(new Error\('Teste do Sentry/);
});
