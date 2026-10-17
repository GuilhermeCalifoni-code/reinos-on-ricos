import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');
const modal=read('src/components/campaign/AssignCharacterModal.tsx');
const campaign=read('src/components/CampaignDetailView.tsx');
const global=read('src/components/CharactersListView.tsx');
const app=read('src/App.tsx');
const css=read('src/design-system/character-assignment.css');
const index=read('src/index.css');

test('Mestre has Associar jogador on each available campaign character card',()=>{
 assert.match(campaign,/ro-character-card__assign-compact/);
 assert.match(campaign,/Associar jogador/);
 assert.match(campaign,/pj\.ownerUserId === currentUserId && !linkedPlayer/);
 assert.match(campaign,/onClick=\{event => \{ event\.stopPropagation\(\); setAssignmentNotice\(''\); setCharacterToAssign\(pj\); \}\}/);
 assert.match(campaign,/<AssignCharacterModal key=\{characterToAssign\.id\}/);
 assert.match(campaign,/onAtribuirFichaPreparada\(campaignId, email, characterId\)/);
 assert.match(campaign,/Associado a: \{linkedPlayer\.nome/);
});

test('global Personagens cards offer direct handoff only to owned sheets for GM campaigns',()=>{
 assert.match(global,/onAtribuirPersonagem\?:/);
 assert.match(global,/campanhasDoMestre\?:/);
 assert.match(global,/ro-character-card__assign/);
 assert.match(global,/Associar jogador/);
 assert.match(global,/personagem\.ownerUserId === currentUserId/);
 assert.match(global,/campanhasDoMestre\.some\(campaign => !personagem\.campaignId \|\| campaign\.id === personagem\.campaignId\)/);
 assert.match(app,/campanhasRemotas\.roleDaCampanha\(campaign\.id\) === 'mestre'/);
 assert.match(app,/onAtribuirPersonagem=\{handleAssociarPersonagemDaBiblioteca\}/);
 assert.match(app,/campaignRepository\.gerenciarFichaPreparada\(campaignId, characterId, true\)/);
 assert.match(app,/campaignRepository\.atribuirFichaPreparadaPorEmail\(campaignId, email, characterId\)/);
 assert.match(app,/A ficha foi adicionada à campanha, mas não entregue/);
});

test('shared modal clearly communicates irreversible transfer; requires active campaign player',()=>{
 assert.match(modal,/aria-modal="true"/);
 assert.match(modal,/role="dialog"/);
 assert.match(modal,/createPortal\(/);
 assert.match(modal,/Campanha/);
 assert.match(modal,/E-mail de login do jogador/);
 assert.match(modal,/o destinatário precisa estar cadastrado/i);
 assert.match(modal,/window\.confirm/);
 assert.match(modal,/Entregar definitivamente/);
 assert.match(modal,/A entrega transfere a propriedade da ficha/);
 assert.match(modal,/await onAssign\(campaignId, trimmedEmail, character\.id\)/);
 assert.match(modal,/setError\(cause instanceof Error/);
 assert.match(modal,/if \(event\.target === event\.currentTarget && !busy\) onClose\(\)/);
 assert.match(css,/z-index: 10000/);
 assert.match(index,/character-assignment\.css/);
});
