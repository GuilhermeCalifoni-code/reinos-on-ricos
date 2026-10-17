# Jogador remove somente seu token no mapa — 16/10/2026

## UX
Mesa ao Vivo → Mapa revelado → Colocar meu Desvelado no mapa (se necessário) → Controlar meu token · ajustar tamanho → **Remover meu token** → confirmação explícita. Essa ação apaga a **instância no mapa**, nunca o Desvelado da biblioteca nem os outros tokens. O jogador pode colocar o token novamente depois.

## Segurança
Uma RPC independente `remove_own_character_token(uuid)` valida `auth.uid()`, token existente bloqueado `FOR UPDATE`, tipo `personagem`, `character_id`, visibilidade do token e mapa, associação a membro ativo com `role='jogador'`, e propriedade da ficha no mesmo `campaign_id`. Ao deletar de `map_tokens`, o banco remove recursos daquele token em `map_token_resources` via `ON DELETE CASCADE`, sem remover ficha. A função não permite execução anônima. O frontend nunca usa a exclusão geral do Mestre.

## Homologação
- [ ] Jogador com token da própria ficha: mover, alterar tamanho e remover; o token desaparece dos dois navegadores, e a ficha permanece.
- [ ] Jogador consegue colocar a mesma ficha novamente, uma nova cópia controlável.
- [ ] Token de outro Jogador/NPC/Adversário/Marcador: botão não disponível; RPC bloqueia.
- [ ] Mapa ou token privado: RPC bloqueia, mesmo com um token id obtido anteriormente.
- [ ] Observador, usuário fora da campanha, usuário deslogado: RPC bloqueia.
- [ ] Erro de conexão ao remover: inspector permanece aberto, com erro visível; não indica sucesso falso.
- [ ] Safari no iPad e Android: fluxo do modal e inspector sem painéis ocultos.
- [ ] Registrar apenas testes em campanha descartável. Preview compartilha banco de produção.

Migrações 043 (colocar e movimentar) e 044 (remover) são dependências do release. Nunca remover a ficha do Desvelado.
