import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUIPreferences } from '../src/services/preferences/uiPreferences';

test('normaliza preferências ausentes para valores seguros', () => {
  assert.deepEqual(normalizeUIPreferences(), {
    theme: undefined,
    density: 'comfortable',
    textScale: 'normal',
    reduceMotion: false
  });
});

test('preserva preferências válidas do usuário', () => {
  assert.deepEqual(normalizeUIPreferences({
    theme: 'dark',
    density: 'compact',
    textScale: 'large',
    reduceMotion: true
  }), {
    theme: 'dark',
    density: 'compact',
    textScale: 'large',
    reduceMotion: true
  });
});

test('descarta valores inválidos de densidade e escala', () => {
  assert.deepEqual(normalizeUIPreferences({
    density: 'invalid' as any,
    textScale: 'giant' as any,
    reduceMotion: false
  }), {
    theme: undefined,
    density: 'comfortable',
    textScale: 'normal',
    reduceMotion: false
  });
});
