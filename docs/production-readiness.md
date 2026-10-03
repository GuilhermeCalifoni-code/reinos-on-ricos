# Reinos Oníricos — Production Readiness

## Estado verificado em 03/10/2026

- Projeto Vercel: `reinos-on-ricos`.
- Produção pública: `https://reinos-on-ricos.vercel.app/`.
- O frontend é estático (Vite/React) e usa Supabase para Auth, Postgres, Realtime e Storage.
- Nenhum erro de runtime foi encontrado pelo Vercel no período de 7 dias consultado.
- O último bloqueio de deploy observado foi **build/deployment rate limit**, não falha do código.
- O GitHub Actions da `main` valida TypeScript, testes e build antes de considerar o código saudável.

## Política de deploy

A aplicação não deve gerar um build Vercel para cada commit de desenvolvimento.

O `vercel.json` deixa automações Git habilitadas apenas para:

- `main`: produção;
- `preview` e `preview/*`: previews deliberados.

Demais branches continuam sendo validadas pelo GitHub Actions, sem consumir builds do Vercel.

Fluxo padrão:

```text
branch de trabalho
   ↓
GitHub Actions
   ↓
Pull Request
   ↓
merge na main
   ↓
Vercel Production
```

Quando for necessário testar visualmente antes do merge:

```text
criar/atualizar preview/<nome>
   ↓
Vercel Preview
```

## Recuperação de falhas

A aplicação possui um Error Boundary global.

Se uma falha de renderização impedir a interface de continuar:

- o usuário recebe uma tela de recuperação em vez de tela branca;
- os dados persistidos não são limpos;
- há uma ação explícita para recarregar a aplicação;
- falhas de chunk dinâmico após um deploy tentam uma única recarga automática.

A aplicação também exibe um aviso quando o navegador fica offline para deixar claro que Realtime e persistência remota podem aguardar reconexão.

## Segurança HTTP

O Vercel aplica cabeçalhos adicionais:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrita para recursos não utilizados atualmente.

HSTS continua sendo fornecido pela própria Vercel.

## Build

O Vite usa code splitting manual apenas para bibliotecas estáveis e pesadas:

- React/React DOM;
- Supabase;
- Motion;
- Lucide.

Views grandes continuam carregadas sob demanda com `React.lazy`.

Objetivos:

- reduzir o chunk inicial;
- melhorar cache entre releases;
- evitar baixar novamente bibliotecas estáveis quando apenas código da aplicação muda.

## Próximas etapas de produção

1. Domínio próprio.
2. SMTP próprio para Auth.
3. Supabase Pro antes do lançamento comercial.
4. Ambiente separado de staging quando houver equipe externa de teste.
5. Testes E2E com Playwright.
6. Testes de carga de Realtime e banco.
7. Monitoramento de erros de frontend com uma ferramenta dedicada.
8. Política de backup e restauração testada.
9. Limpeza de objetos órfãos no Supabase Storage.
10. Observabilidade de métricas de sessão: conexões Realtime, eventos e latência.
