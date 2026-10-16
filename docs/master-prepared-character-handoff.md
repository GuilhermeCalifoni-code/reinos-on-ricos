# Fichas prontas para one-shots — entrega de Desvelados por e-mail

## Estado de implantação
**Em revisão no PR #104; migration 040 e 041 NÃO aplicadas à produção.** A interface pode compilar, mas não funciona até a aplicação segura das duas migrations. Não executar transferências com campanhas reais durante homologação. A verificação real de RLS com duas contas continua pendente.

## Fluxo para o Mestre
1. O Mestre cria fichas próprias em **Personagens**. O teto de 50 fichas para contas admin depende da migration 039 do PR #102, que é uma mudança separada.
2. Os jogadores entram no Reinos Oníricos com seus e-mails e aderem à campanha por código de convite. **É necessário ser Jogador ativo da campanha antes da entrega.**
3. O Mestre abre **Campanha → Personagens → Membros da campanha**, seleciona sua ficha pronta e informa o **e-mail exato usado para o login** do destinatário.
4. O sistema pede confirmação antes de transferir a titularidade. A ficha passa a pertencer ao Jogador; sua ficha anterior é preservada, mas desvinculada da campanha. Isso é uma entrega definitiva, não um mero empréstimo temporário.
5. A associação é persistida em `campaign_members.character_id`; na Mesa o Jogador só poderá usar aquela ficha e seus atributos/Foco nos Dados.

## Segurança dos dados pessoais
- O e-mail é resolvido **exclusivamente no servidor** por uma RPC com `SECURITY DEFINER`, jamais por `auth.users` no navegador.
- O Mestre já precisa ser Mestre da campanha antes da consulta. O alvo precisa ser membro ativo com papel Jogador **da mesma campanha**.
- Busca EXATA e normalizada: não fornece listagem de contas nem permite enumeração de outros usuários.
- A RPC 041 chama a 040, que revalida propriedade exclusiva da ficha pelo Mestre, vínculo com campanha, limite de quota do destinatário e operação transacional.
- Não deve existir qualquer escrita direta em `campaign_members.character_id` ou `personagens.owner_user_id` pelo frontend.
- O formulário é desabilitado durante processamento e mostra erro. E-mail malformado é bloqueado.

## Testes necessários
- [ ] Lint/test/build verdes na branch de desenvolvimento.
- [ ] Backup criptografado real do banco e Storage com restauração comprovada.
- [ ] Aplicar migration 040 e depois 041 em ambiente de homologação com privilégios mínimos.
- [ ] Atribuir ficha com e-mail exato (com variações de caixa): permitido só ao Mestre proprietário.
- [ ] E-mail desconhecido, usuário que ainda não entrou ou papel observador: falha genérica, sem revelar cadastro.
- [ ] Mestre tenta entregar ficha de terceiro ou de outra campanha: rejeitado.
- [ ] Jogador no limite do plano: rejeitado e estado anterior preservado.
- [ ] O jogador abre Dados: atributos e Foco da ficha entregue; Mestre usa rolador independente.
- [ ] Transferência não apaga outra ficha do Jogador; erros não deixam operações parciais.
- [ ] Duas contas simultâneas e reconexão atualizam sem recarregar após a migration 037 de Realtime.
- [ ] Mobile Safari/Android/desktop: formulário legível.

**Não armazenar e-mails pessoais ou tokens em testes versionados no repositório público.**
