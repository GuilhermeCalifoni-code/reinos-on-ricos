# Feedback visual do rolador (vídeo 16/10/2026)

O vídeo (81,66 s) mostra a ferramenta Dados em um notebook com Teste Mundano, atributos, DT, modos Normal/Vantagem/Desvantagem, Foco e modificadores; o usuário também abre Dano do Sonhar.

**Limitação:** o vídeo contém áudio, mas não temos uma transcrição confiável das falas. Não inventar solicitações faladas. A gravação visual tampouco comprova erro no clique do botão Executar Teste.

## Correções de usabilidade fundamentadas nas imagens
- Antes da primeira rolagem, a área vazia de Resolução não ocupa metade da janela; as configurações usam mais largura.
- Campo para digitar DT exata (8–25) preservando os presets e o slider existentes.
- Cada rolagem Mundana produz resultado imediato e acessível junto do botão.
- Depois do primeiro teste, a decomposição continua disponível na coluna lateral.
- NÃO altera a lógica em src/rules/rulesEngine.ts nem a mecânica de Foco, DT, vantagem/desvantagem ou dados.

## Verificação necessária
- [ ] Laptop: área vazia não ocupa coluna inteira antes do primeiro teste.
- [ ] DT via botões, campo e slider: valores coerentes.
- [ ] Vantagem e desvantagem: dado escolhido/decomposição corretos.
- [ ] Rolagem consecutiva: feedback atualizado e acessível.
- [ ] Dados no Registro Vivo: verificar compartilhamento e privacidade.
- [ ] Navegadores móveis e tablet.
- [ ] Confirmar áudio/solicitações narradas antes de tratar estas melhorias como resposta completa.

Preview e produção compartilham banco; não fazer teste destrutivo.
