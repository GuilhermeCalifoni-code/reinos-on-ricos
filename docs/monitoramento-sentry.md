# Aviso de erros (Sentry)

Roteiro 10/10, **T4**. Ligado em 06/11/2026 (PR #133). Conta do Guilherme, entrando pelo GitHub.

## Para que serve
Quando o site quebra para alguém (jogador ou Mestre), o Sentry recebe o erro na hora. A gente fica sabendo **antes de a pessoa reclamar** e vê em que tela e em que versão aconteceu.

## Onde ver
- Painel: https://autonomo-1u.sentry.io/issues/ (projeto `reinos-on-ricos`, time `#autonomo`).
- O filtro **Envs** separa **production** (o site oficial) de **preview** (os sites de teste dos PRs).
- Cada erro mostra a versão (o commit) que estava no ar.

## Como funciona
| O quê | Como ficou |
|---|---|
| Onde liga | Só no site publicado: produção e previews da Vercel. No computador de quem programa (localhost), fica desligado. |
| O que manda | O erro, a tela onde ele aconteceu, o navegador e a versão do site. |
| Dados pessoais | **Só o id do usuário logado.** Nunca o e-mail nem o nome (LGPD). |
| Gravação de tela (Session Replay) | **Desligada.** |
| Tracing, Logs e Métricas | **Desligados**, para não gastar a cota grátis. Dá para ligar depois. |
| Alertas | Os do padrão do Sentry: avisa por e-mail quando aparece um problema novo de prioridade alta. |

## Testar
Abra o site com `?teste-sentry` no fim do endereço (ex.: `https://reinos-on-ricos.vercel.app/?teste-sentry`). O site abre normal, e em até um minuto aparece no painel o erro **"Teste do Sentry (Reinos Oníricos): pode ignorar"**. Pode marcar como resolvido.

## No código
- `src/lib/monitoramento.ts`: liga o Sentry e define o que é enviado.
- `src/main.tsx`: chama `iniciarMonitoramento()` antes de montar a tela.
- `src/components/system/AppErrorBoundary.tsx`: quando a tela quebra, avisa o Sentry.
- `src/App.tsx`: informa o id do usuário ao entrar e apaga ao sair.
- `vite.config.ts`: passa o ambiente e a versão da Vercel.
- O DSN fica no código porque é público por natureza. Pode ser trocado pela variável `VITE_SENTRY_DSN` na Vercel.
