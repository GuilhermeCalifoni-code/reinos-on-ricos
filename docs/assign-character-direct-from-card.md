# Associar jogador diretamente pelo card do Desvelado

## Como usar

**Na campanha:** Minhas Campanhas → [Campanha] → Personagens → localizar Desvelado preparado → **Associar jogador** → informar e-mail de login → confirmar entrega.

**Pela biblioteca pessoal:** Menu Personagens → escolher Desvelado de sua propriedade → **Associar jogador** → escolher uma de suas campanhas → informar e-mail de login → confirmar. Se a ficha estava livre, o app a vincula à campanha antes da transferência.

## Restrições e estado
- O botão aparece apenas para Mestre, apenas em ficha própria e apenas em campanha compatível. Não autoriza atribuir fichas de outros usuários.
- O destino deve já estar cadastrado e ser Jogador ativo da campanha (aplicado no banco pela RPC 041, que delega à 040).
- É uma TRANSFERÊNCIA DEFINITIVA, não empréstimo. O novo dono fica com a ficha; o Mestre a continua vendo no elenco.
- Falhas da RPC são exibidas, sem fechar o modal; ao concluir o app atualiza personagens e participantes.
- Se a ficha estava solta e a transferência falha, ela permanece **no elenco da campanha**, sem perda de dados; há mensagem explícita.
- Nenhuma migration adicional. Usa 039–042 já aplicadas com snapshot interno no schema `ro_release_backups`.
- A versão principal do site não foi alterada. Somente Preview após CI.

## QA obrigatório antes de produção
- [ ] Conta Mestre: card na aba Personagens da campanha, e na biblioteca global.
- [ ] Sem cargo Mestre: botão não aparece.
- [ ] Ficha que pertence a outro jogador: botão não aparece.
- [ ] Clicar não abre ficha involuntariamente.
- [ ] Janela abre e fecha com X, Escape e clique no fundo; desabilita enquanto entrega.
- [ ] E-mail inválido, sem conta, fora da campanha: mostra erro e conserva ficha.
- [ ] Entrega para jogador ativo: nova titularidade, vínculo do participante e Dados com atributo/foco corretos.
- [ ] O Mestre continua usando Dados independentes, não gasta Foco do personagem entregue.
- [ ] Em celular, modal rola e cabe na tela em retrato e paisagem.
