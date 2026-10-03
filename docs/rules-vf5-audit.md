# Auditoria de regras — Livro Básico VF5

Fonte de verdade desta rodada: **Livro_Basico_RO_VF5.pdf** (167 páginas).

## Escopo revisado

A auditoria percorreu as regras de criação e progressão de Desvelados, Testes, Foco, Ruptura, Delírio, Dano, Movimento de Morte, Condições, Descanso, Contadores, Distâncias, Combate, Sonhar, Potência, Objetos/Estruturas, Vida e criação/condução de Adversários.

## Regras que já estavam alinhadas

- Defesa = 8 + Corpo.
- Resistência = 6 + Corpo.
- PV e Foco por nível.
- PO = 2 em todos os níveis.
- Pontos de Sonhar e limite de Domínio.
- Teste Mundano e 20 natural.
- Teste Onírico com Realidade/Sonhar independentes e Ruptura -1 / 0 / +1 / +2.
- Dano convertido em 1/2 PV, ou 3 PV pela regra opcional de Dano Massivo.
- PO reduz no máximo 1 PV por ocorrência.
- Potência 0/1/2/2/3 Passos e regra de aplicar todos os Passos a uma característica.
- Resistência de Objetos/Estruturas.

## Divergências encontradas e corrigidas nesta branch

- Movimento de Morte: Realidade vence não recupera PV; estabiliza em 0 PV e deixa o Personagem inconsciente.
- Assistente de Sonhar: DT padrão corrigida para 13 e resultados corrigidos para Convergência / Realidade vence / Sonhar vence / Divergência.
- Percepção Onírica: não exige Teste Onírico para perceber/interpretar algo presente; interferir ou revelar ativamente algo oculto exige manifestação.
- Alcance do Sonhar e escala de Distâncias atualizados, incluindo Além.
- Duração atualizada para Instantâneo / 1 Rodada / 1 Cena conforme nível.
- Referência de DT do Sonhar ativo adicionada: 10/12/14/16/18.
- Tentativas sucessivas e múltiplas manifestações documentadas na referência de mesa.
- Delírio deixou de ser automático apenas por haver testemunha Velada; agora considera efeito Coincidente, Moderado ou Intenso.
- Ruptura deixou de exibir estágios/sintomas inventados e agora representa apenas a trilha 0–6 e o Efeito de Ruptura ao alcançar 6.
- Condições de Desvelados passaram a ser persistidas e o Descanso realmente remove uma Condição escolhida.
- Projeto Pessoal foi adicionado aos Movimentos de Descanso.
- Criação de Desvelado passou a iniciar com Recursos 1 (Escasso).
- A tabela de dano da ficha deixou de associar intensidade do dado a um alcance fixo; Área e Distância são propriedades da fonte/narrativa.
- Adversários passaram a usar referências de NA, Vida, Dificuldade, Resistência e Nível de Perigo da VF5.
- Habilidades de NPC/Adversário agora suportam alvo, alcance, dano, consequência e gatilho de Reação.
- Rolagem de ataque de Adversário passou a pedir Defesa/DT do alvo e não soma NA automaticamente.

## Referências novas expostas em “Mais”

- Alcance e Duração do Sonhar por nível.
- DT do Sonhar ativo.
- Tabela de Vida: Cura e Ferimento.
- Intensidade de Dano.
- Área e Distância de Dano.
- Regras completas de Movimento de Morte.
- Condições.
- Descanso.
- Distâncias.
- Neutralização.
- Referências de criação de Adversários.
- Potência e Objetos/Estruturas já adicionados anteriormente.

## Decisões editoriais / pontos para o livro

Há uma inconsistência interna na referência de **Tamanho** para Potência: a regra detalhada de Potência e a seção de Objetos/Estruturas usam **Pequeno** como base, enquanto uma referência rápida posterior usa **Médio**. O sistema mantém **Pequeno**, porque é a referência usada na regra detalhada. Isso deve ser decidido/corrigido na próxima revisão editorial do livro.

## Não adicionado

Não foi criado um sistema universal de tipos de dano com resistência/vulnerabilidade/imunidade, porque a VF5 auditada não estabelece uma mecânica geral desse tipo.

## Banco

A única mudança de schema desta rodada é a persistência das Condições na tabela `personagens`, em:

`supabase/migrations/011_character_conditions.sql`

É aditiva e preserva os dados existentes.
