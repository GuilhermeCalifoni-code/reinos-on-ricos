import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration=readFileSync('supabase/migrations/033_master_private_live_counters.sql','utf8');
const table=readFileSync('src/components/live/LiveTable.tsx','utf8');
const panel=readFileSync('src/components/live/CounterPanel.tsx','utf8');
const dock=readFileSync('src/components/live/LiveDock.tsx','utf8');
const session=readFileSync('src/components/live/SessionPanel.tsx','utf8');
const hook=readFileSync('src/features/realtime/useCampaignRealtime.ts','utf8');
const repo=readFileSync('src/features/realtime/liveTableRepository.ts','utf8');
const styles=readFileSync('src/design-system/live-counters-master.css','utf8');

test('Jogador não visualiza contadores no dock, painel nem Registro Vivo',()=>{
  assert.match(dock,/tools\.filter\(\(\[id\]\) => mestre \|\| id !== 'contadores'\)/);
  assert.match(table,/mestre && ferramenta === 'contadores'/);
  assert.match(table,/const contadoresAtuais = mestre \?/);
  assert.match(session,/\{mestre && <section className="live-table__counter-slot"/);
  assert.match(panel,/if \(!mestre\) return null/);
});

test('Repositório não consulta nem assina stream de contadores para jogadores',()=>{
  assert.match(repo,/async load\(campaignId: string, includePrivateCounters = false\)/);
  assert.match(repo,/includePrivateCounters \? api\.from\('session_counters'\)/);
  assert.match(repo,/if \(subscribePrivateCounters\) \{/);
  assert.match(hook,/liveTableRepository\.load\(campaignId, role === 'mestre'\)/);
  assert.match(hook,/\}, role === 'mestre'\);/);
  assert.match(hook,/role, userId\]/);
});

test('RLS protege contadores independentemente de opção legada compartilhada',()=>{
  assert.match(migration,/update public\.session_counters set visibilidade='mestre_privado'/);
  assert.match(migration,/check \(visibilidade='mestre_privado'\)/);
  assert.match(migration,/for select to authenticated\s+using \(public\.is_campaign_master\(campaign_id\)\)/);
  assert.doesNotMatch(migration,/can_read_live_content\(campaign_id, visibilidade\)/);
});

test('Eventos privados: inclusive histórico já publicado deixa de chegar a jogadores',()=>{
  assert.match(migration,/update public\.session_events\s+set visibility='mestre'/);
  assert.match(migration,/as restrictive for select to authenticated/);
  assert.match(migration,/type<>'counter_update' or public\.is_campaign_master\(campaign_id\)/);
  assert.match(migration,/as restrictive for insert to authenticated/);
  assert.match(panel,/type: 'counter_update',\s+visibility: 'mestre'/);
});

test('Mestre pode criar, aumentar e diminuir valor e máximo sem recarregar',()=>{
  assert.match(panel,/onAdicionar\(\{/);
  assert.match(panel,/valorMaximo: novoMaximo/);
  assert.match(panel,/const ajustarMaximo = \(contador: Contador, delta: number\)/);
  assert.match(panel,/const aplicarMaximo = \(contador: Contador\)/);
  assert.match(panel,/atualizarValores\(contador, contador.valorAtual \+ delta, contador.valorMaximo\)/);
  assert.match(panel,/onAtualizar\(contador.id, \{ valorAtual: atual, valorMaximo: maximo, estado, visibilidade: 'mestre_privado' \}\)/);
  assert.match(panel,/aria-label=\{`Aumentar máximo de/);
  assert.match(styles,/@media\(max-width:600px\)/);
  assert.match(hook,/pendingCounterWritesRef/);
  assert.match(hook,/syncCounters\(replace\(countersRef\.current, \{\.\.\.previous,\.\.\.patch/);
  assert.doesNotMatch(table,/window\.location\.reload/);
});

test('Escrita no banco impede Jogador de criar, editar ou excluir',()=>{
  assert.match(migration,/Previous write policies/);
  assert.match(hook,/if \(role !== 'mestre'\) throw new Error\('Contadores são exclusivos do Mestre\.'\)/);
  assert.match(repo,/\.from\('session_counters'\)\.update\(values\)/);
});
