# Auditoria e atualização do site — Guia de Regras RO RPG vf4 (19 páginas)

**Fonte recebida:** `Guia_Regras_RO_RPG_vf4 .pdf`, Reinos Oníricos RPG • Diogo Zornoff. Documento PLAYTEST de 19 páginas. Material de referência do autor; não substitui automaticamente decisões editoriais sobre conflitos com Livro Básico VF10.

## Mudanças confirmadas e integradas na interface
- **Potência do Sonhar, pág. 15:** remover Passo de Área da lista de benefícios; Contador altera limite/quantidade restante (não progresso); Resistência: ±1 ponto; Deslocamento: ±1 categoria, base Próximo; Quantidade não aumenta Área nem ignora Espaço. A tabela da interface e o Compêndio ficam alinhados.
- **Área do Sonhar, pág. 9 e 14:** alvo único como padrão; vários alvos individuais requerem combinação coerente com Espaço (nível de Área correspondente).
- **Duração, pág. 14:** N1 instantâneo; N2–3 uma Rodada; N4–5 uma Cena. Incluída referência visível na aba Sonhar da Mesa.
- **Dano contínuo, pág. 9:** dano inicial normal e novo lançamento do mesmo dado no FIM de cada Rodada enquanto a exposição continuar; cessa ao sair da Área, interromper fonte ou cessar exposição. Não replicar automaticamente efeitos instantâneos sem fonte persistente.
- **Compêndio:** tabelas e conteúdo detalhado alinhados, nova entrada pesquisável de Dano Contínuo; origem e paginação de 44 verbetes agora citam vf4 páginas 4–19 em vez das antigas páginas 152–167. História externa e Natureza dos Adversários conservam fonte original.
- **Sem quebra de dados:** não há migration nova de Supabase nesta revisão editorial. Personagens/tokens/campanhas permanecem intactos.

## Regras que já estavam implementadas corretamente
- Testes Mundanos e Reflexos; Testes Oníricos com d20 de Realidade e d20 de Sonhar; DT Onírica normalmente 13, consequências de Ruptura; Vantagem/Desvantagem apenas Mundano/Reflexo (pág. 5 e 10).
- PV, PF, PO, R e Defesa, progressão nível 1–5 (pág. 4–5).
- Descanso, distâncias, condições, combates e efeitos ativos (pág. 10–17).
- Vida: Cura/Ferimento e seus limites; Movimento de Morte (pág. 9, 16).
- Adversários e nível de ameaça (pág. 18).

## Conflitos editoriais identificados: **não automatizar sem decisão do autor**
1. **Correr:** pág. 11/12: gaste a Ação e mova até Longe; página 19, quadro numérico: `Reflexo Corpo DT 15+; sucesso dobra deslocamento`. O site mantém por enquanto a regra detalhada da seção Combate (sem Teste automático). Definir qual é a versão autoral definitiva.
2. **Foco em Teste Onírico:** pág. 4: até 1 PF antes de um Teste para +2, sem especificar tipo; pág. 19: `1 PF = +2 em Mundano/Reflexo`. A implementação atual também permite Foco no Onírico, seguindo leitura mais ampla já presente antes do vf4. Não remover esse recurso unilateralmente até validação do autor.
3. **Dano contínuo vs livro anterior:** `docs/auditoria-regras-vf10.md` referia Livro Básico VF10 p.104 como ausência de repetição automática. Guia vf4 pág. 9 usa rolagem no fim de cada Rodada com exposição persistente. O Compêndio agora distingue fonte persistente de instante e aplica a diretriz explícita do vf4; manter a divergência anotada para fechamento editorial.
4. **Fonte dos exemplos avançados não presentes no vf4:** quaisquer regras específicas de DCR e natureza de Pesadelos permanecem referenciadas aos respectivos livros, não ao novo Guia.

## Publicação
- CI: `npm run lint`, `npm test`, `npm run build`.
- Verificar deployment `READY` de produção e domínio `reinos-on-ricos.vercel.app` com mesmo SHA de `main`.
- Rollback: branch de backup de `main` anterior à publicação.
- Segurança: não aplicar migrations 037/038 pendentes sem backup recuperável, auditoria de políticas e QA com Mestre/Jogador.
