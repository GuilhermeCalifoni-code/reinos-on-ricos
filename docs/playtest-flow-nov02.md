# Atualização de Playtest — Fluxo de Mesa (02/11/2026)

Feedback do usuário: rolar dados sem abandonar a ficha; Teste Onírico também fora da ficha; desvincular sem apagar; marcador Morte; contadores compartilhados; alternância Jogador/Mestre; textos Regras.

## Uso do Jogador
1. Na ficha completa, botões Teste Mundano e Teste Onírico abrem um rolador expandido **na própria ficha**. Cada atributo tem Testar aqui. Como a ficha pode ser aberta fora da sessão, o rolador embutido exibe resultado local; para rolagens compartilhadas é necessário usar a Mesa Ao Vivo.
2. Na Mesa Ao Vivo, Dados ou o novo atalho Onírico registram no Registro Vivo quando conectado. O Onírico escolhe a aba com os dois d20 (Realidade/Sonhar); nunca Vantagem/Desvantagem.
3. Minha ficha → Desvincular sem excluir, com confirmação. Em Campanha → Participantes também existe Desvincular ficha (sem excluir). O Desvelado permanece salvo na Biblioteca.
4. Na edição do próprio token (se visível e vinculado), marque Morte junto a Oculto, Impedido e Vulnerável. Morte é um marcador, não modifica PV automaticamente.
5. Contadores exibidos pelo Mestre aparecem em uma barra resumida, atualizada e pesquisável no botão Contadores.
6. O organizador mostra Rodada, turno Jogador/Mestre e quem já agiu; somente o Mestre avança/pausa/reinicia.

## Uso do Mestre
- Em Campanha → Participantes pode remover a associação da ficha com confirmação, sem apagar a ficha nem o participante.
- Contadores: marca Compartilhar com jogadores ao criar, ou usa Exibir para todos/Tornar privado num contador existente; os antigos continuam privados.
- Organizador: Iniciar Rodada 1, escolher a ordem proposta pelos Jogadores, Encerrar Jogador → Mestre → próximo Jogador. Não existe iniciativa. Estado sincronizado em `live_session_states.metadata.roundTracker` (campo já presente no banco).
- Nos Dados, o Mestre mantém rolador livre sem ficha. O atalho Onírico abre um Teste Onírico separado sem ficha/gasto de recursos, inicialmente privado.

## Segurança e persistência
- Migration 047 remove apenas a restrição que obrigava contadores privados; nova política SELECT para `authenticated` exige `visibilidade='compartilhado'` **e** membro ativo da campanha. SELECT de Mestres privados permanece.
- Nova Condição `morte` em `map_tokens`; RPC de Jogador exige `auth.uid()`, propriedade do Desvelado, membro ativo, visibilidade e tipo personagem. Tokens de NPC/Adversário permanecem sob gestão do Mestre.
- Estado de Rodada reaproveita JSONB da sessão e RLS existente, sem criar tabela nova. Apenas Mestre edita.
- Não executar SQL antes de snapshot dos objetos afetados e de auditar grants/SELECT/UPDATE.
- Sem alteração automática de fichas, recursos, tokens e campanhas existentes.

## Testes manuais exigidos antes de produção
- [ ] Conta Jogador rola Mundano/Onírico na ficha sem navegar; na Mesa o Registro Vivo recebe os eventos.
- [ ] Mestre testa Onírico privado; Jogador não enxerga dados privados.
- [ ] Jogador desvincula sua ficha, fecha/reabre sessão e associa novamente; ficha permanece na Biblioteca.
- [ ] Mestre desvincula membro sem eliminar a ficha do proprietário.
- [ ] Contador antigo permanece privado; compartilhar mostra em outra sessão; tornar privado remove da tela do jogador, inclusive após recarga.
- [ ] Somente próprio token pode marcar Morte; não altera vida nem bloqueia rolagens.
- [ ] Mestre avança Jogador/Mestre até nova rodada e Jogador acompanha em tempo real; nenhuma ação duplicada por dois cliques.
- [ ] Mobile e desktop sem sobreposição de mapas, caixas e indicadores de Rodada.

**Divergências do Guia vf4**: Correr e Foco permanecem pendentes de decisão editorial conforme a auditoria anterior; não inventar regra.
