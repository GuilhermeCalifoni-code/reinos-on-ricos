# Hotfix 046: alterações parciais dos tokens não devem redefinir outros campos

## Falha confirmada em produção, 17/10/2026
A função SQL `move_own_map_token` envolvia `greatest(0, least(100, p_x))` com `coalesce(..., x)`. No PostgreSQL, `LEAST` e `GREATEST` **ignoram** argumentos NULL, de modo que o resultado não era NULL: para `p_x=NULL` resultava 100. Para `p_token_size=NULL`, 4. Para `p_range_cells=NULL`, 30. Assim, clicar em tamanho, raio ou arrastar fazia campos não enviados mudarem sozinhos. A ficha Mila teve `x=100, y=100, token_size=4` gravados por essa falha.

## Correção
- Migration 046 usa `CASE WHEN p_x IS NULL THEN x ELSE greatest(...) END` para cada campo independente (x, y, tamanho, raio).
- Mantém proprietário da ficha, identidade autenticada, membro jogador ativo, visibilidade do mapa/token, clamp e privilégios restritos.
- Notifica o PostgREST para atualizar cache RPC.
- Não executa `UPDATE` direto em tokens existentes nem os recoloca no mapa. A operação passa a valer imediatamente no Supabase compartilhado com a produção, sem depender de novo deploy do frontend.
- Snapshot privado `ro_release_backups.pre_oct17_token_partial_patch_tokens` (10 tokens) e função anterior salvos antes da migração. Snapshot interno não substitui backup externo.

## Casos a homologar com Jogador + Mestre
- [ ] Ajustar +0,25×: X, Y e raio permanecem idênticos, tamanho avança só 0,25×.
- [ ] Ajustar raio de movimento: tamanho e coordenadas não mudam.
- [ ] Arrastar token para outra posição: tamanho e raio não mudam.
- [ ] Ativar/desativar condição: todos os demais campos preservados.
- [ ] Reabrir Mesa e conferir persistência do resultado de cada ação.
- [ ] Token alheio, oculto, NPC, adversário: Jogador não pode modificar.
- [ ] Testar duas contas simultâneas numa campanha de teste.
- [ ] Não restaurar automaticamente a posição da Mila: mudança desejada não é conhecida.

**Mudanças aplicadas no Supabase**: migration 046. Registro de migração versionado nesta branch; nenhuma mudança de interface exigida.
