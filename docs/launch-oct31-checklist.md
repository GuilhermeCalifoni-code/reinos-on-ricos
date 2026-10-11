# Operação Reinos Oníricos 9.0 — lançamento 31/10/2026

## Datas e política
- **16/10 (sexta):** maior parte das correções P0/P1 pronta em preview para homologação e divulgação técnica.
- **31/10 (sábado):** meta de lançamento público, com decisão go/no-go baseada em testes.
- Branch de trabalho: `feat/launch-hardening-oct31`. Pull Requests + CI + Preview antes de merge na `main`.
- **Não executar testes destrutivos em produção.** Não compartilhar tokens, senhas nem service-role no navegador.
- Sem suprimir falhas: todo bug relevante deve gerar issue e teste de regressão.

## Issues prioritárias
- #84 — Logos, avatares, retratos, imagens e assinaturas de URL do Storage.
- #85 — Fichas/membros e sincronização da Mesa ao Vivo.
- #86 — **Segurança bloqueadora:** privacidade do Supabase Storage privado vs. recursos `mestre_privado`.
- #87 — Login/Google/Discord e tela de autorização (inclusive identidade visual no provedor).
- #88 — Testes E2E, resiliência do Realtime e falhas visíveis.
- #89 — QA visual/responsivo.
- #90 — Staging, backup, rollback, observabilidade.

## Padrão de qualidade para aceitar correções
1. Reprodução do bug antes do patch e evidência da resolução depois.
2. TypeScript `npm run lint`, testes `npm test` e build `npm run build` verdes no CI.
3. Teste em duas contas isoladas (Mestre e Jogador), incluindo reconexão.
4. Captura de telas desktop + mobile; tema claro e escuro.
5. Nenhuma regressão de permissões, fichas, estado ao vivo ou acesso a ativos privados.
6. Aprovação em preview com dados artificiais.
7. Plano de rollback verificável.

## Checklist de homologação
- [ ] Mestre entra na campanha com jogador já vinculado.
- [ ] Jogador entra após Mestre e nova ficha aparece sem refresh.
- [ ] Troca/desvinculação atualiza Mesa sem expor ficha alheia.
- [ ] Usuário troca imagem da própria ficha, sem editar outro dono.
- [ ] NPCs/adversários carregam retrato no estúdio e mapa.
- [ ] Logos aparecem em login, dashboard, ficha, menu e favicon.
- [ ] Avatar da conta aparece no dashboard, configurações e Mesa.
- [ ] URL assinada expirada se renova sem quebrar a imagem.
- [ ] Fallback aparece em imagem ausente/negada, sem loops.
- [ ] Mestre oculta token e Jogador deixa de enxergar instantaneamente.
- [ ] PV/Foco/Ruptura sincronizam e persistem.
- [ ] Rolagens, Registro Vivo, cenas e contadores privados respeitam RLS.
- [ ] Login e logout e-mail, Google e Discord, inclusive cancelamento de autorização.
- [ ] Não há acesso direto aos arquivos de cenas, mapas e adversários privados por Jogador.
- [ ] Mesa móvel passa teste de uso real (Android/iOS quando disponível).
- [ ] Sessão simultânea de 2 horas com Mestre + 4 Jogadores.
- [ ] Backup e restauração em staging validados.
- [ ] Versionamento/rollback documentados e executáveis.

**Nota:** 9/10 é objetivo sujeito à homologação; P0/P1 críticos em aberto bloqueiam lançamento.
