# Auditoria de qualidade da Mesa ao Vivo (11/10/2026)

## Meta
Tornar a Mesa usável por Mestre e Jogador em desktop e celular antes da prévia de 16/10 e do lançamento planejado de 31/10. Não inventar regras: todas as mecânicas de Reinos Oníricos devem permanecer consistentes com o Livro Básico VF10.

## Confirmado na leitura do código
- Integrado no Preview 948efd84: retratos reais, avatar e correção do fallback de seleção de ficha.
- Integrado no Preview: assinaturas renováveis no componente AssetImage (intervalo de 50 minutos); acesso deve ser validado com navegador real após expiração.
- Integração de elenco via `personagens` Realtime; a publicação de `campaign_members` ainda **não** foi aplicada.
- Nova melhoria desta branch: seletor de ficha pessoal na Mesa para Jogadores, com mensagens de erro e restrição de proprietário via RPC.
- `LiveTable` contém `catch(() => undefined)` em caminhos de eventos e troca de cenas. É preciso trocar por feedback confiável para o Mestre.
- `MapStage` distingue token oculto de condição Oculto. Manter a semântica.
- `useCampaignRealtime`: verificar corrida entre carga inicial e eventos recebidos, reconexão e limpeza do estado sensível.
- A mesa tem layout de Mestre com painel de direção, elenco, mapas, contadores e Registro Vivo. Há CSS extenso e sobreposição de arquivos responsivos; validação visual real é obrigatória.

## Homologação Mestre
1. Entrar com campanha/episódio; painel de direção abre sem bloquear canvas ou esconder ferramentas.
2. Criar e selecionar cena, mapa e handout; verificar visibilidade e reação da tela do Jogador.
3. Drag de Desvelado, NPC e adversário no mapa, inclusive múltiplas instâncias, zoom, pan, grade e áreas.
4. Editar PV/FO/Ruptura, condições e ocultação. O Jogador não recebe metadados privados.
5. Controlar contador privado, alternar sessão e reconectar.
6. Abrir e fechar painéis por teclado/esc, sem sobreposições, todos os layouts móveis.

## Homologação Jogador
1. Entrar via convite e ver apenas a própria ficha.
2. Trocar/vincular/desvincular ficha na Mesa sem precisar visitar preparação do Mestre.
3. Ver personagens autorizados, tokens revelados, rolagens públicas e Registro Vivo correto.
4. Não conseguir selecionar/controlar outro Desvelado.
5. Não obter URL assinada de cena/mapa/adversário privado por path conhecido.
6. Reconexão após perda de rede, rotação do telefone, troca de tema e navegação de painéis.

## Bloqueadores de lançamento
- Sem backup externo verificável, não aplicar migrations de Storage e Realtime à produção.
- Sem uma sessão real Mestre/Jogador testando permissões e sincronização, não concluir #85/#86.
- Nunca publicar backups, URL de banco, service-role ou fotos privadas num repositório público.
- Nenhuma alteração em `main` até testes e revisão completos.
