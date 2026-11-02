import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path:string)=>readFileSync(path,'utf8');
const original=read('supabase/migrations/033_master_private_live_counters.sql');
const sharing=read('supabase/migrations/047_shared_counters_death_condition.sql');
const table=read('src/components/live/LiveTable.tsx');
const panel=read('src/components/live/CounterPanel.tsx');
const dock=read('src/components/live/LiveDock.tsx');
const hook=read('src/features/realtime/useCampaignRealtime.ts');
const repository=read('src/features/realtime/liveTableRepository.ts');

test('Existing counters retain their original private visibility until the Mestre shares',()=>{
  assert.match(original,/update public\.session_counters set visibilidade='mestre_privado'/);
  assert.match(original,/for select to authenticated\s+using \(public\.is_campaign_master\(campaign_id\)\)/);
  assert.match(panel,/compartilharNovo, setCompartilharNovo\] = useState\(false\)/);
  assert.match(panel,/compartilharNovo \? 'compartilhado' : 'mestre_privado'/);
  assert.match(panel,/Tornar privado/);
  assert.match(panel,/Exibir para todos/);
});

test('Mestre controls editing; Player only receives RLS-filtered counters in read-only view',()=>{
  assert.match(sharing,/visibilidade = 'compartilhado'/);
  assert.match(sharing,/public\.is_campaign_member\(campaign_id\)/);
  assert.doesNotMatch(sharing,/drop policy "masters read counters only"/);
  assert.match(hook,/if \(role !== 'mestre'\) throw new Error\('Contadores são exclusivos do Mestre\.'\)/);
  assert.match(panel,/if \(!mestre\) return \(/);
  assert.match(panel,/contadores\.filter\(c=>c\.visibilidade==='compartilhado'\)/);
  assert.match(dock,/tools\.map\(\(\[id, label, Icon\]\)/);
  assert.match(table,/ferramenta === 'contadores' && <CounterPanel/);
  assert.match(table,/contadoresPublicos/);
});

test('Client subscribes for explicit shared counter changes but refetches on visibility change',()=>{
  assert.match(repository,/async visibleCounters\(campaignId: string\)/);
  assert.match(repository,/\.from\('session_counters'\)\.select\('\*'\)/);
  assert.match(repository,/table:'session_counters'/);
  assert.match(hook,/liveTableRepository\.visibleCounters\(campaignId\)/);
  assert.match(hook,/role !== 'mestre' && item\.visibilidade !== 'compartilhado'/);
  assert.match(table,/countersVisibilityVersion: Date\.now\(\)/);
  assert.match(hook,/pendingCounterWritesRef/);
});

test('Counter updates in GM panel preserve sharing instead of forcibly turning private',()=>{
  assert.match(panel,/onAtualizar\(contador\.id, \{ valorAtual: atual, valorMaximo: maximo, estado \}\)/);
  assert.match(panel,/const ajustarMaximo = \(contador: Contador, delta: number\)/);
  assert.match(panel,/const aplicarMaximo = \(contador: Contador\)/);
  assert.match(panel,/aria-label=\{`Aumentar máximo de/);
  assert.match(hook,/syncCounters\(replace\(countersRef\.current, \{\.\.\.previous,\.\.\.patch\}\)\)/);
  assert.doesNotMatch(table,/window\.location\.reload/);
});

test('Counter journal events remain private even when a progress dial is shared',()=>{
  assert.match(original,/update public\.session_events\s+set visibility='mestre'/);
  assert.match(original,/type<>'counter_update' or public\.is_campaign_master\(campaign_id\)/);
  assert.match(panel,/type: 'counter_update',\s+visibility: 'mestre'/);
});
