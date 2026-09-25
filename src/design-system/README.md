# Design system — Reinos Oníricos

`tokens.css` concentra os tokens de cor, espaçamento, foco, superfícies e movimento da aplicação. Nesta fase, os componentes de fundação são classes CSS leves (`ro-button`, `ro-button--quiet`, `ro-icon-button`, `ro-surface`, `ro-empty-state` e `ro-eyebrow`) para que as telas existentes possam migrar gradualmente sem trocar sua lógica ou sua estrutura de dados.

As cores representam os três estados visuais: base editorial em carvão e marfim; atividade onírica em índigo, vinho e ouro; e estados funcionais de segurança, alerta e perigo. O tratamento de Ruptura existente continua restrito à mesa e respeita `prefers-reduced-motion`.
