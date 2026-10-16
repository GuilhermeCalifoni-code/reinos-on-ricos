# Associação de ficha e execução dos dados — revisão 16/10

## Problema confirmado
- DiceRoller recebia apenas `personagemAtivo={selecionado}`, sem seleção própria da ficha dentro da ferramenta. A barra de personagens some no modo compacto para celular.
- Sem ficha vinculada, atributos eram silenciosamente definidos como 0 e o formulário ainda permitia marcar Foco.
- As rolagens eram enviadas por callback `registrarSemFalhar`: chamadas assíncronas falhas não atualizavam o feedback do rolador.
- SessionFeed esperava `event.metadata.roll`, mas DiceRoller enviava valores apenas na raiz de `metadata`.
- Movimento de Morte calculava localmente, sem registrar a rolagem na Mesa.

## Correções no Preview
1. Mestre escolhe qualquer Desvelado visível da campanha dentro do modal Dados.
2. Jogador escolhe apenas fichas próprias elegíveis e as associa à campanha via RPC preexistente.
3. Personagem associado aparece acima dos dados, com valor atual de Foco; rolagens avulsas deixam claro que não têm atributos nem Foco.
4. Testes Mundano, Onírico, Dano e Movimento de Morte enviam resultados estruturados ao Registro, com ID da ficha quando associada.
5. Registros aguardam confirmação real, exibem salvamento ou erro, não inventam sucesso.
6. Nenhuma alteração no motor de regras ou no banco de produção; Foco só se aplica quando há ficha com pontos disponíveis.

## Homologação obrigatória (Mestre + Jogador)
- [ ] Mestre seleciona uma ficha no modal Dados, rola Teste Mundano e muda para outra, verificando atributos e personagem associados.
- [ ] Jogador sem ficha entra, abre Dados, associa sua ficha pessoal e verifica que a Mesa e o rolador são atualizados sem atualizar a página.
- [ ] Jogador não enxerga fichas de outros participantes no seletor.
- [ ] Rolagem Mundana normal, vantagem e desvantagem seguem o motor oficial; custo de 1 PF acontece apenas quando autorizado.
- [ ] Teste Onírico gera dois d20 distintos, mostra quadrantes e registra valores de Realidade e Sonhar.
- [ ] Dano exibe rolagem e destaca total no Registro; não aplica dano diretamente ao alvo.
- [ ] Movimento de Morte registra evento e oferece aplicação na própria ficha.
- [ ] Simular falha de rede na inserção e verificar "Rolagem feita, mas não registrada" sem falsos sucessos.
- [ ] Conferir sucesso, reconexão e resultado visível no Registro Vivo, em desktop, Android e Safari.
- [ ] Validar se a sessão está realmente autenticada e se as duas identidades podem ler os eventos conforme RLS.

Preview utiliza o mesmo banco da produção: não testar mudanças persistentes em campanhas reais.
