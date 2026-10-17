# Jogador coloca e controla o token do próprio Desvelado

## Problemas encontrados
- A UI e a RLS permitiam criar tokens diretamente apenas ao Mestre. A ficha associada à conta não ativava nenhuma ação de colocar o próprio token.
- Tokens do tipo `personagem` criados manualmente sem `character_id` não pertencem a nenhum Jogador, mesmo que seu nome coincida com uma ficha. Um token no banco pode ter ficha sem membership associado.
- Falhas de gravação ao arrastar eram ignoradas; ao mexer em tamanho o erro existia, mas só era visível se o inspetor fosse acessível.

## Correção
- Jogador ativo com ficha própria vinculada vê `Colocar meu Desvelado no mapa` na visualização de mapa revelado. RPC cria **apenas** o token dessa ficha com nome/retrato reais; se já existir token visível dessa ficha no mapa, devolve-o em vez de duplicar.
- Jogador vê `Controlar meu token · ajustar tamanho` se o token já está visível; esse botão abre o inspetor e tamanho pode variar de 0,5× a 4×, alcance de 0 a 30 casas.
- Usuário sem ficha recebe instrução; jogador não pode criar monstros, mapas, marcadores livres ou tokens alheios.
- A RPC de movimentação e tamanho foi reforçada: somente personagem próprio, membro ativo com papel jogador, token e mapa visíveis. Revogada execução anônima.
- Ao arrastar, salvar posição mostra mensagem de erro quando não persistir.

## Testes obrigatórios antes de produção
- [ ] Mestre publica mapa; jogador ativa conta e ficha, coloca token e ele aparece para ambas as contas.
- [ ] Jogador move token, refresca página e posição se mantém.
- [ ] Jogador usa tamanho + e −, refresca página e tamanho se mantém.
- [ ] Jogador usa controle de alcance e estados; verifica que não interfere em adversários ou colegas.
- [ ] Jogador tenta criar token em mapa privado: RPC rejeita.
- [ ] Jogador sem ficha, observador e anônimo: RPC rejeita.
- [ ] Jogador com ficha de outra campanha: RPC rejeita.
- [ ] Jogador chama RPC duas vezes: retorna o mesmo token visível, sem duplicação.
- [ ] GM ocultou token já colocado: jogador não pode criá-lo novamente para contornar a privacidade.
- [ ] iPad Safari: toque/arrasto, toque em `Controlar meu token` e botões de tamanho.
- [ ] Não testar com campanhas reais no Preview porque o Supabase é compartilhado.
