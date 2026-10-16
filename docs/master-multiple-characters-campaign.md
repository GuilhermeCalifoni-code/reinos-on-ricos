# Inclusão de múltiplas fichas pelo Mestre

## Problema original
O fluxo de ingressar pelo convite/ligar ficha à conta do Mestre gravava `campaign_members.character_id`, campo único por participante. Cada associação substituía a anterior. Isso não cria um elenco de personagens preparados.

## Correção
- Na criação de campanha: campo opcional para selecionar várias fichas pessoais livres.
- Na campanha existente: **Personagens > Elenco preparado pelo Mestre > Adicionar ao elenco**, com seleção repetida e remoção das fichas próprias não atribuídas.
- A RPC `manage_master_character_roster` altera somente `personagens.campaign_id`, sem associar a ficha ao `campaign_members.character_id` do Mestre. Para ficha vinculada anteriormente ao próprio Mestre, o vínculo antigo poderá ser liberado com segurança.
- O mesmo Desvelado não pode entrar em duas campanhas simultaneamente e nunca é desvinculado se associado a um Jogador.
- Entregar por e-mail usa migrations 040/041 existentes: transferência definitiva para um Jogador ativo e persistência da associação àquela conta.
- Sem novos planos nem custos; usa projeto atual. A quota de fichas do Mestre continua administrada pelo PR 102/migration 039.

## Homologação
- [ ] Backup recuperável antes da ativação de migrations 039–042.
- [ ] Mestre cria campanha selecionando três fichas; as três surgem no elenco sem novas linhas de `campaign_members`.
- [ ] Mestre adiciona mais uma ficha, remove outra não atribuída; nada é apagado da biblioteca.
- [ ] Ficha atribuída a um Jogador não pode ser retirada pela opção de Mestre.
- [ ] Tentativa de adicionar ficha alheia ou de outra campanha falha.
- [ ] Entrega por e-mail ao Jogador da campanha funciona e não altera demais fichas.
- [ ] Dados do Mestre não herdam nenhum personagem; Dados do Jogador usam a ficha recebida.
- [ ] Conferir erros em alterações parciais na criação: a campanha permanece criada e mensagens explicam as fichas pendentes.
- [ ] Testar Safari iPad, desktop e Android.
- [ ] Não homologar escrevendo em campanhas reais: Preview compartilha produção.
