# Fichas prontas para one-shots — entrega de Desvelados

## Fluxo proposto
1. Mestre cria as fichas em **Personagens** usando a própria conta. Durante o playtest, admins poderão ter até 50 vagas após a migration `039_admin_character_playtest_quota.sql` ser aplicada.
2. Jogadores entram na campanha pelo código de convite com suas próprias contas.
3. Mestre abre **Campanha > Personagens > Membros da campanha** e usa **Entregar Desvelado pronto** no participante.
4. O sistema mostra uma confirmação explícita: a ficha passa a pertencer ao jogador; ficha anterior do jogador continua salva, mas é desvinculada da campanha.
5. Após a transferência segura do backend, o jogador acessa sua ficha na Mesa, não outra ficha privada.

## Segurança
- Exige `is_campaign_master(campaignId)` e jogador ativo na própria campanha.
- Só transfere ficha de propriedade do próprio Mestre, que não esteja vinculada a outro usuário/campanha.
- Verifica limite de armazenamento do jogador, preserva a ficha anterior e serializa entregas concorrentes.
- A função é `SECURITY DEFINER` com `search_path=''`, validações explícitas e execução apenas para `authenticated`.
- É uma **transferência definitiva de titularidade**, e não um simples apontamento de tela. Reversões exigem ferramenta administrativa específica, ainda não implementada.

## Para homologar
- [ ] Backup externo restaurável antes de migration 040; **não aplicar em produção sem isso**.
- [ ] Aplicar migration em ambiente validado e testar com Mestre, Jogador e invasor.
- [ ] GM oferece ficha própria a um Jogador ativo: passa; depois o GM deixa de ser proprietário.
- [ ] Outro Mestre, Jogador ou Anônimo tenta atribuir: deve falhar.
- [ ] GM tenta ficha que pertence a outra conta ou a outra campanha: deve falhar.
- [ ] GM tenta atribuir ao jogador que não entrou na campanha: deve falhar.
- [ ] Jogador já no limite da sua cota: bloqueio claro, nenhuma transferência parcial.
- [ ] Jogador já vinculado: ficha anterior permanece íntegra e desvinculada da campanha, sem excluir.
- [ ] Jogador vê a ficha atribuída ao entrar na Mesa; Mestre vê o personagem no elenco; confirmar realtime após migration 037.
- [ ] Verificar retratos de fichas transferidas no Storage e permissões RLS.
- [ ] Verificar modo celular e atualização com duas contas distintas.

Os PRs da Mesa (mobile) e a migration de quotas 039 têm seus próprios fluxos de revisão. Integrar com cuidado, sem push direto em `main`.
