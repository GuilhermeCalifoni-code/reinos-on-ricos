# Dois contextos distintos para Dados — 16/10/2026

## Diagnóstico
A primeira integração obrigava o Mestre a selecionar uma ficha de Desvelado. Isso também enviava o `characterId` selecionado ao Registro e permitia gastar Foco daquela ficha. Essa vinculação é incorreta para a condução da Mesa.

## Comportamento desejado
**Mestre**: um rolador independente (quantidade de dados, d4/d6/d8/d10/d12/d20/d100, modificador, DT opcional, descrição). Nunca seleciona ou altera um Desvelado. Rolagens privadas por padrão, compartilhadas apenas quando a opção for marcada; eventos têm `characterId = null` e `metadata.authorRole = mestre`.

**Jogador**: usa exclusivamente o Desvelado associado à campanha, com atributos, Foco, Testes Mundanos/Oníricos, Dano e Movimento de Morte. Se não possuir ficha, há seletor de fichas próprias e a ferramenta não permite rolar em nome de um personagem inexistente. Rolagens vão a todos e carregam `characterId` da ficha.

**NPCs/Adversários**: Mestre mantém rolagens próprias pelo inspetor do token e elenco; elas não usam fichas de Jogadores.

## Aceite do QA
- [ ] Conta Mestre sem Desvelado usa Dados, rola 2d20 + 3, vê 2 resultados e total, não perde Foco.
- [ ] Mestre privado: conta Jogador não vê evento; se marcar compartilhamento, ambos veem.
- [ ] Conta Jogador sem ficha: só vê orientação para associar, nunca rolador do Mestre.
- [ ] Jogador vincula ficha pessoal: atributos e PF vêm dessa ficha, sem poder selecionar ficha de terceiro.
- [ ] Mudança de ficha não preserva dados de teste anterior.
- [ ] Mestre com antiga ficha vinculada: novos eventos genéricos continuam com `character_id = NULL`.
- [ ] Rolagem em NPC/Adversário continua independente.
- [ ] RLS: jogador não insere eventos Mestre/privados; a role da campanha é consultada em vez do perfil global.
- [ ] Safari/iPad em paisagem, Android e desktop: layout acessível.

Nenhuma migration de banco e nenhuma alteração de permissões são necessárias. Não inserir rolagens de teste nas campanhas reais: Preview utiliza o Supabase da produção.
