# Melhorias Futuras

Separei aqui algumas ideias para evoluir o projeto aos poucos, sem perder a simplicidade. São melhorias que ajudam no desempenho, na experiência de uso e na manutenção do código, mas continuam viáveis para implementação por alguém júnior/pleno.

---

## Performance e Escalabilidade

- Cache do menu e listas
  - Usar cache (ex.: Redis para cache distribuído, ou `lru-cache` em memória) nas rotas `GET /menu` e `GET /products`, com invalidação quando algo for criado/editado/removido.
  - Resultado: respostas mais rápidas e menos carga no banco.

- ETag e Cache-Control
  - Enviar `ETag`/`Last-Modified` e cabeçalhos `Cache-Control` para rotas de leitura.
  - Resultado: clientes e CDNs reaproveitam respostas quando nada mudou.

- Índices direcionados e revisão de queries
  - Criar índices compostos para filtros mais comuns (ex.: `(category, is_visible)` e `(product_id, day_of_week, start_time)`), validando com `EXPLAIN ANALYZE`.
  - Resultado: consultas bem mais rápidas em cenários reais.

---

## Qualidade de Código e DX (Developer Experience)

- Tipos de request/response compartilhados
  - Centralizar tipos em `shared/types` e reaproveitar no Zod e nas respostas.
  - Resultado: menos divergência e melhor autocompletar.

- Verificação de SQL nas strings
  - Adicionar `eslint-plugin-sql` (ou regra similar) para checar sintaxe básica e padrões de segurança.
  - Resultado: erros pegos mais cedo, antes do deploy.

- Script único de qualidade
  - Criar `npm run check` para rodar lint, type-check e testes de uma vez (opcionalmente, um pre-push hook).
  - Resultado: fluxo de desenvolvimento mais consistente.

---

## Observabilidade e Confiabilidade

- Logs com `requestId`
  - Incluir um identificador por requisição e propagar nos logs.
  - Resultado: rastreabilidade muito melhor ao investigar problemas.

- Métricas com Prometheus
  - Expor `/metrics` com `prom-client` (latência por rota, erros, acertos de cache).
  - Resultado: visibilidade real do comportamento da API em produção.

- Healthcheck e Readiness
  - Adicionar `/health` (leve) e `/ready` (com checagem de DB) e integrar ao Docker.
  - Resultado: deploys mais seguros e monitoramento mais simples.

---

## UX e Novas Features

- Paginação e filtros em produtos
  - Suportar `page`, `pageSize`, `category`, `isVisible` e retornar `X-Total-Count`.
  - Resultado: respostas menores e UIs mais fluidas.

- Descrição e imagem no produto
  - Adicionar `description` e `imageUrl` com validação e refletir no cardápio.
  - Resultado: cardápio mais informativo para o usuário final.

- Visibilidade agendada
  - Permitir janelas de visibilidade (ex.: horário de almoço), parecido com promoções.
  - Resultado: menos intervenção manual e mais controle do cardápio.

---

## Segurança e Boas Práticas

- Rate limiting
  - Usar `@fastify/rate-limit` com limites por IP/rota.
  - Resultado: proteção simples contra abuso.

- Validações mais completas
  - Expandir os schemas Zod (tamanhos, enums, faixas numéricas) com mensagens claras e mapear corretamente para `400`.
  - Resultado: dados mais consistentes e erros mais fáceis de entender.

---

## Infra e Deploy

- Variáveis de ambiente validadas
  - Centralizar leitura/validação com Zod (ex.: `env.ts`) e falhar cedo em caso de configuração inválida.
  - Resultado: menos surpresas em runtime.

- Docker multi-stage mais enxuto
  - Ajustar o `Dockerfile` para reduzir tamanho de imagem (ex.: `node:20-alpine`) e usar `npm ci --omit=dev` em produção.
  - Resultado: builds e deploys mais rápidos e baratos.

---

## Roadmap Sugerido

1) Cache do menu
2) Rate limiting
3) Tipos compartilhados + validações
4) ETag/Cache-Control
5) Health/Readiness + logs com `requestId`
6) Paginação e filtros
7) Métricas Prometheus
8) Descrição e imagem
9) Índices + `EXPLAIN ANALYZE`

