# Reinos Oníricos — Plataforma de Mesa

Aplicação web para preparar, organizar e conduzir campanhas de **Reinos Oníricos RPG**.

A proposta não é substituir o Livro Básico, e sim transformar as regras e o material de campanha em uma experiência de mesa integrada: ficha, rolagens, Sonhar, Registro Vivo, contadores, mapas narrativos e preparação do Mestre no mesmo lugar.

## Estado atual

A plataforma possui dois modos de uso:

- **Online / Supabase:** autenticação, campanhas compartilhadas, papéis por campanha, fichas vinculadas, Registro Vivo, Presence, estado da Mesa Ao Vivo, contadores, mapas e tokens em Realtime.
- **Local:** modo de demonstração com persistência no navegador para testar a experiência sem backend.

A interface online distingue **Mestre**, **Jogador** e **Observador**. Permissões sensíveis não dependem apenas da interface: o banco usa RLS para proteger campanhas, fichas, eventos e conteúdo privado do Mestre.

## Mesa Ao Vivo

A Mesa Ao Vivo reúne personagens e recursos essenciais, cena atual, Registro Vivo com mensagens/falas/OOC/whispers/rolagens/eventos, contadores narrativos, mapas com zoom/pan/grade/tokens, dados, Guia do Sonhar, ficha rápida e referência atual das regras.

O mapa remoto usa **Supabase Storage privado**. A aplicação salva o caminho do arquivo e gera URL assinada para exibição, evitando gravar imagens em base64 no banco.

## Preparação de campanha

Campanhas online possuem fundação remota para sessões, personagens, NPCs, adversários, locais, pistas, lore, anotações, cenas, handouts, mapas narrativos, membros e códigos de convite.

Conteúdo de campanha pode usar os estados de visibilidade mestre_privado, compartilhado e revelado_jogadores.

## Regras automatizadas

O motor segue a versão atual do Guia Autônomo de Playtest:

- Teste Mundano: 1d20 + Atributo ≥ DT;
- 20 natural é sucesso automático;
- Teste Onírico: Realidade e Sonhar são comparados separadamente;
- Convergência: manifestação acontece, crítico e -1 Ruptura;
- Realidade vence: manifestação não acontece e 0 Ruptura;
- Sonhar vence: manifestação acontece e +1 Ruptura;
- Divergência: manifestação não acontece e +2 Ruptura;
- Resistência: 6 + Corpo;
- Defesa: 8 + Corpo;
- dano é convertido em perda de 1/2 PV, ou 3 PV com Dano Massivo opcional;
- no máximo 1 PO reduz a perda em 1 PV por ocorrência;
- Movimento de Morte usa 2d20 contra DT 13;
- não há iniciativa em Cena de Tensão;
- Movimento integra a Ação;
- Contadores podem resolver processos em etapas.

As regras puramente mecânicas ficam centralizadas em src/rules.

## Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres + RLS
- Supabase Realtime
- Supabase Storage
- Motion
- Lucide React

## Supabase

As migrations ficam em:

~~~text
supabase/migrations/
001_auth_profiles.sql
002_campaigns.sql
003_characters_campaign_links.sql
004_rls_foundation.sql
005_fix_invite_code_function.sql
006_session_events.sql
007_reload_postgrest_schema_cache.sql
008_live_table_realtime.sql
009_campaign_content_and_storage.sql
010_actor_sheets.sql
011_character_conditions.sql
~~~

Para um projeto novo, execute as migrations **na ordem**. A configuração de infraestrutura é feita fora da interface do produto, diretamente no Supabase e pelas variáveis de ambiente.

Variáveis de ambiente:

~~~env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
~~~

Nunca coloque service_role no frontend.

## Desenvolvimento

Instale dependências:

~~~bash
npm ci
~~~

Execute localmente:

~~~bash
npm run dev
~~~

Validações:

~~~bash
npm run lint
npm test
npm run build
~~~

npm run lint executa a verificação TypeScript (tsc --noEmit). Os testes mecânicos usam o runner nativo do Node através de tsx.

A branch possui CI no GitHub Actions executando os três passos acima.

## Estrutura em evolução

A arquitetura está sendo migrada de componentes grandes para responsabilidades menores:

~~~text
src/
  components/
    campaign/
    live/
    master/
  design-system/
  features/
    realtime/
  rules/
  services/
    auth/
    campaigns/
    characters/
    session-events/
    storage/
  types/
supabase/
  migrations/
~~~

O objetivo é continuar extraindo funcionalidades por fluxo sem reescrever de uma vez as partes estáveis da aplicação.

## Próximas frentes

A fundação já está pronta para evoluir cenas e handouts como bibliotecas reutilizáveis, quadro de investigação, compêndio, assistência de IA e voz por WebRTC. Voz e vídeo **ainda não fazem parte do estado atual**.

---

**Reinos Oníricos RPG**  
“Você sonhou. Teve um Pesadelo. Acordou. E continuou sonhando.”
