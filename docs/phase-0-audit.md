# Fase 0 — Auditoria inicial

## Estado preservado

- `src/rules/rulesEngine.ts` contém os cálculos e a resolução dos Testes Mundanos e Oníricos, incluindo Convergência, Realidade vence, Sonhar vence, Divergência, dano e Ruptura. Nenhuma regra foi alterada nesta fase.
- `src/types/character.ts`, `src/data/characterStore.ts` e `src/components/CharacterSheet.tsx` formam o fluxo de ficha, persistido em `localStorage` e sincronizado com Supabase quando configurado.
- `src/types/campaign.ts`, `src/data/campaignStore.ts` e `src/components/CampaignDetailView.tsx` concentram campanhas, sessões, NPCs, adversários, locais, pistas, lore e anotações. Os dados locais e seus identificadores foram preservados.
- `src/components/MesaView.tsx`, `CinematicTable.tsx`, `DiceRoller.tsx`, `DreamGuide.tsx`, `MasterPanel.tsx` e `SceneStudio.tsx` já implementam ferramentas de mesa. Não foram alterados nesta fase.

## Estrutura atual e direção incremental

| Área | Estado | Direção |
| --- | --- | --- |
| `src/components` | Componentes de tela misturam apresentação e parte da orquestração. Há arquivos extensos, como ficha e painel do mestre. | Extrair por fluxo quando cada área receber evolução funcional, sem uma migração geral agora. |
| `src/data` | Stores de campanhas e personagens funcionam localmente; personagens possuem adaptação ao Supabase. | Manter como compatibilidade local e introduzir serviços por recurso nas fases que exigirem persistência remota. |
| `src/rules` | Motor independente de apresentação e bem delimitado. | Preservar como fonte de verdade mecânica e ampliar com testes antes de qualquer nova regra. |
| `src/design-system` | Criado nesta fase. | Migrar telas gradualmente para tokens e primitivas compartilhadas. |
| `src/lib/supabaseClient.ts` | Cliente opcional e CRUD de personagens/rolagens. | Substituir as permissões abertas antes de colocar recursos de campanha em produção. |

## Riscos encontrados

1. `src/data/supabaseSqlScript.ts` cria políticas RLS permissivas (`USING (true)` e `WITH CHECK (true)`). Isso não é adequado para produção e permite acesso sem a separação Mestre/Jogador planejada.
2. Campanhas e seus recursos ainda são locais; somente personagens e rolagens possuem integração remota opcional. Uma mesa compartilhada exigirá modelagem, RLS e Realtime próprios.
3. Componentes extensos aumentam o risco de regressão em futuras mudanças. A divisão será feita apenas nas áreas que forem evoluídas.
4. O bundle inicial excede 500 kB compactado. A separação por rota ou carregamento sob demanda deve ser tratada depois de estabilizar os fluxos da plataforma.

## Correção de ambiente

O manifesto pedia `esbuild` 0.25 enquanto a versão declarada de Vite 8 exige 0.27 ou superior. A dependência foi atualizada para 0.28.2 e o lockfile do npm foi registrado para tornar a instalação reproduzível.
