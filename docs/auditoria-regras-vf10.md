# Auditoria de regras — fontes VF10 (2026-10-08)

## Fontes solicitadas
- `Livro_Basico_RO_VF10.pdf` — referência principal para mecânicas.
- `Guia_Rapido_Reinos_Oniricos_vf.pdf` — consultas resumidas; conferir contra o Livro Básico em caso de divergência.
- `RO_Adversarios_vf3.pdf` — Natureza, perfis, ações e exemplos de adversários.
- `Ficha_Desvelado_RO_RPG_Editavel_FONTE_MAIS_3.pdf` — organização de campos; não é fonte de novas mecânicas.

## Correções aplicadas neste ciclo

| Área | Documento | Ajuste de código / consulta |
|---|---|---|
| Movimento de Morte | Livro Básico VF10, pág. 42; Guia Rápido, seção 5 | Sonhar vence: recupera **1 PV e +1 Ruptura**, consciente. Realidade vence: estabiliza inconsciente com **0 PV**. Motor, UI e testes alinhados. |
| Teste Reflexo | Livro Básico VF10, pág. 109; Guia Rápido, seção 3 | Deve haver consequência concreta, reação imediata e possibilidade plausível; não é teste extra para negar um Sonhar já realizado. |
| Dano contínuo | Livro Básico VF10, pág. 104 | Não há repetição automática a cada Rodada; nova exposição significativa depende da ficção. |
| Potência/Tamanho | Livro Básico VF10, seção Potência do Sonhar, tabela e exemplo de Tamanho (pág. 91) | **Médio** é a base mecânica dos Passos de Potência. |
| Distâncias | Livro Básico VF10, faixas de distância; Guia Rápido, seção 6 | Muito Próximo ~1,5–3 m; Próximo ~3–9 m; Longe ~9–15 m; atualizar descrições equivocadas de quarteirão. |
| Delírio | Guia Rápido, seção 4 | Nome da categoria sem Delírio: **Coincidente**, não 'Leve' como rótulo de classe. |
| Criaturas oníricas | Livro de Adversários vf3, seção Natureza dos Adversários | Ausência de um aspecto impede manipulá-lo na criatura; não implica imunidade geral ao Domínio na Cena. |

## Divergências que exigem decisão editorial — não inventar regra
- **Tamanho**: a tabela principal e os exemplos do Livro Básico VF10 usam **Médio** como base da Potência; a seção final “Objetos e Estruturas” do Guia Rápido ainda diz “Tamanho parte de Pequeno”. Mantivemos a referência do Livro Básico, mas a revisão textual desse trecho do guia deve ser submetida ao autor.
- **Resistência por Passos**: o Guia Rápido resume como **±1**, enquanto a tabela da seção Potência do Livro Básico tem formulação por **categoria**. Não automatizar arbitrariamente uma das leituras até padronizar o texto.
- A terminologia da seção de Natureza no Livro de Adversários distingue **Emocional, Manifesta e Primordial**. Qualquer modelo ou ficha fora do escopo das regras documentadas precisa validação do autor.

## Verificação
Executar `npm run lint && npm test && npm run build`. O fluxo Mestre/Jogador em dois navegadores não é substituído pelos testes unitários.
