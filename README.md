# Goomer Menu API

API RESTful para gerenciamento de cardápio de restaurante desenvolvida com TypeScript, Fastify e PostgreSQL.

## 📑 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Como Executar](#como-executar)
- [Dados de Teste](#populando-com-dados-de-teste)
- [Rotas da API](#rotas-da-api)
- [Testes](#testes)
- [Desafios Encontrados](#desafios-encontrados)
- [Arquitetura](#arquitetura)
- [Scripts](#scripts)
- [Stack Técnica](#stack-técnica)
- [Banco de Dados](#banco-de-dados)
- [Checklist de Requisitos](#checklist-de-requisitos)
 - [Melhorias Futuras](#melhorias-futuras)

---

## Sobre o Projeto

Este projeto foi desenvolvido como desafio técnico para avaliação de conhecimentos em desenvolvimento back-end. A API permite gerenciar produtos, promoções e exibir um cardápio consolidado com suporte a horários e timezone.

**Principais funcionalidades:**
- ✅ CRUD completo de produtos e promoções
- ✅ Cardápio consolidado com promoções ativas por horário
- ✅ Controle de visibilidade de produtos
- ✅ Ordenação personalizada de produtos
- ✅ Suporte a timezone para diferentes estados
- ✅ Testes automatizados com Testcontainers

---

## Como Executar

### Pré-requisitos

- Node.js 20 ou superior
- Docker e Docker Compose
- npm ou yarn

### Instalação Passo a Passo

#### 1. Clone e instale as dependências

```bash
git clone <url-do-repositorio>
cd Goomer-Menu-API
npm install
```

#### 2. Configure as variáveis de ambiente

```bash
# Windows PowerShell
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

#### 3. Inicie o banco de dados

```bash
docker-compose up -d db
```

#### 4. Execute as migrations

```bash
# Windows PowerShell
$env:DATABASE_URL="postgres://goomer:goomer@localhost:5432/goomer"; npm run db:migrate

# Linux/Mac
DATABASE_URL="postgres://goomer:goomer@localhost:5432/goomer" npm run db:migrate
```

#### 5. Inicie o servidor

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

#### 6. Popule com dados de teste (Opcional)

Para facilitar os testes, execute o script que cria dados de exemplo:

```bash
node scripts/seed-data.js
```

Este script cria:
- 3 Entradas (Bruschetta, Salada Caprese, Azeitonas)
- 3 Pratos principais (Pizza Margherita, Pizza Calabresa, Risotto)
- 3 Bebidas (Chopp Artesanal, Refrigerante, Suco)
- 3 Promoções (uma para cada categoria)

### Executando com Docker Compose

Para rodar tudo em containers Docker:

```bash
docker-compose up --build
```

---

## Populando com Dados de Teste

Para facilitar os testes, criei um script que popula o banco com dados de exemplo:

```bash
node scripts/seed-data.js
```

**O que o script cria:**
- ✅ 3 Entradas: Bruschetta, Salada Caprese, Azeitonas
- ✅ 3 Pratos principais: Pizza Margherita, Pizza Calabresa, Risotto
- ✅ 3 Bebidas: Chopp Artesanal, Refrigerante, Suco Natural
- ✅ 3 Promoções com horários (uma para cada categoria)

**Depois de executar, teste:**

```bash
# Ver cardápio
curl http://localhost:3000/menu

# Listar produtos
curl http://localhost:3000/products

# Listar promoções
curl http://localhost:3000/promotions
```

---

## Rotas da API

Documentação completa disponível em [Rotas](./ROTAS_API.md).

### Endpoints Principais

#### Produtos
- `GET /products` - Lista todos os produtos
- `POST /products` - Cria um produto
- `GET /products/:id` - Busca produto por ID
- `PATCH /products/:id` - Atualiza produto
- `PATCH /products/:id/visibility` - Altera visibilidade
- `DELETE /products/:id` - Remove produto

#### Promoções
- `GET /promotions` - Lista todas as promoções
- `POST /promotions` - Cria uma promoção
- `GET /promotions/:id` - Busca promoção por ID
- `PATCH /promotions/:id` - Atualiza promoção
- `DELETE /promotions/:id` - Remove promoção

#### Menu
- `GET /menu?tz=America/Sao_Paulo` - Cardápio consolidado

### Exemplo de Uso

```bash
# Criar um produto
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chopp Artesanal",
    "priceCents": 1200,
    "category": "Bebidas",
    "isVisible": true
  }'

# Ver cardápio
curl http://localhost:3000/menu
```

---

## Testes

O projeto possui **24 testes E2E** cobrindo todos os fluxos principais:

- CRUD completo de produtos
- CRUD completo de promoções
- Funcionalidades opcionais (ordenação e timezone)
- Validações de regras de negócio
- Cenários de erro

### Executar Testes

```bash
npm test
```

Os testes utilizam **Testcontainers** para criar ambientes isolados com PostgreSQL real. Cada suite de testes recebe seu próprio banco de dados que é criado antes dos testes e destruído após, garantindo isolamento completo e sem conflitos com o ambiente de desenvolvimento.

---

## Desafios Encontrados

### 1. Ambiente de Teste com Banco Real e Isolado

**Desafio:** Criar testes com banco real sem conflitar com desenvolvimento, sem consumo excessivo de memória e com isolamento completo.

**Solução:** Usei **Testcontainers** para containers PostgreSQL temporários e isolados:

```typescript
export async function startTestDb(): Promise<TestDbHandle> {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("goomer_test")
    .withUsername("postgres")
    .withPassword("postgres")
    .start();
  
  // Container criado, migrations executadas
  return { container, databaseUrl, stop: async () => await container.stop() };
}
```

**Benefícios:**
- Isolamento completo por teste
- Sem conflito com ambiente de desenvolvimento
- Limpeza automática após testes
- Performance controlada

---

### 2. Timezone Handling em SQL

**Desafio:** Verificar promoções ativas considerando timezones diferentes para restaurantes em vários estados.

**Solução:** Utilizei `AT TIME ZONE` do PostgreSQL para converter timestamps UTC para o timezone local:

```sql
WITH now_local AS (
  SELECT (now() AT TIME ZONE ${timezone}) AS ts_local
)
WHERE EXTRACT(DOW FROM nl.ts_local)::int = s.day_of_week
  AND CAST(nl.ts_local::time AS time) >= s.start_time
  AND CAST(nl.ts_local::time AS time) < s.end_time
```

---

### 3. Múltiplas Promoções Ativas Simultaneamente

**Desafio:** Produtos podem ter múltiplas promoções válidas no mesmo horário.

**Solução:** Implementei subquery LATERAL que seleciona a promoção com menor preço:

```sql
LEFT JOIN LATERAL (
  SELECT *
  FROM active_promos ap
  WHERE ap.product_id = b.id
  ORDER BY ap.promo_price_cents ASC
  LIMIT 1
) ap ON TRUE
```

---

### 4. SQL Puro vs Type Safety

**Desafio:** Usar SQL puro conforme requisito, mantendo type safety do TypeScript.

**Solução:** Criei interfaces dedicadas para tipar resultados SQL:

```typescript
export interface ProductRow {
  id: number;
  name: string;
  priceCents: number;
  // ...
}

async create(): Promise<ProductRow> {
  const result = await this.db.execute(sql`...`);
  return result.rows[0] as ProductRow;
}
```

---

### 5. Ordenação por Categoria

**Desafio:** Ordenar por categoria específica (Entradas → Pratos principais → Sobremesas → Bebidas) ao invés de alfabética.

**Solução:** CASE WHEN no SQL para mapear categorias:

```sql
ORDER BY 
  CASE b.category
    WHEN 'Entradas' THEN 1
    WHEN 'Pratos principais' THEN 2
    WHEN 'Sobremesas' THEN 3
    WHEN 'Bebidas' THEN 4
  END,
  COALESCE(b.sort_order, 999999),
  b.name
```

---

## Arquitetura

### Estrutura do Projeto

```
src/
├── app/                # Configuração da aplicação
│   ├── plugins/       # Plugins Fastify
│   └── server.ts      # Entry point
├── db/                # Camada de dados
│   ├── schema/       # Drizzle schemas
│   └── migrations/   # Migrations SQL
├── modules/           # Módulos de negócio
│   ├── products/     # Produtos
│   ├── promotions/   # Promoções
│   └── menu/         # Menu consolidado
└── shared/           # Código compartilhado
    ├── errors/       # Classes de erro
    ├── middleware/   # Middlewares
    └── types/        # Tipos TypeScript
```

### Padrões Utilizados

- **Repository Pattern**: Acesso a dados isolado
- **SQL Puro**: Queries críticas em raw SQL
- **Type Safety**: Tipagem completa em TypeScript
- **Validação**: Zod para entrada de dados
- **Error Handling**: Tratamento centralizado

---

## Scripts

```bash
npm run dev           # Inicia servidor de desenvolvimento
npm run build         # Compila para produção
npm run start         # Inicia versão de produção
npm test              # Executa testes
npm run lint          # Verifica qualidade do código
npm run format        # Formata código
npm run db:generate   # Gera migrations
npm run db:migrate    # Executa migrations
```

---

## Stack Técnica

- **Fastify** - Framework web de alta performance
- **PostgreSQL** - Banco de dados relacional
- **Drizzle ORM** - Migrations e schemas
- **TypeScript** - Tipagem estática
- **Zod** - Validação de schemas
- **Vitest** - Framework de testes
- **Testcontainers** - Testes com banco real
- **Docker** - Containerização

---

## Banco de Dados

### Tabelas

- **products** - Produtos do cardápio
- **promotions** - Promoções
- **promotion_schedules** - Horários das promoções

### Constraints e Índices

- Validação de categorias válidas
- Validação de preços positivos
- Foreign keys com CASCADE
- Índices para otimização de performance

---

## Controle de Versão

### Inicializando o Git

Para criar commits organizados:

```bash
# Windows PowerShell
.\setup-git.ps1

# Linux/Mac  
bash setup-git.sh
```

### Estrutura de Commits

O projeto segue commits semânticos em inglês:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `chore:` - Configuração/melhorias
- `test:` - Testes
- `docs:` - Documentação
- `refactor:` - Refatoração

### Branch Strategy

- `main` - Código em produção
- `develop` - Desenvolvimento principal  
- `feature/*` - Features individuais

---

## Melhorias Futuras

Visando a evolução contínua do projeto, separei alguns ajustes e implementações futuras que podem melhorar o desempenho e a experiência de uso sem perder a simplicidade da solução. A lista completa está aqui:

 - [Melhorias para o futuro](./MELHORIAS_FUTURAS.md)

---

## Checklist de Requisitos

- [x] TypeScript em todo o projeto
- [x] Fastify sem imposição de arquitetura
- [x] PostgreSQL com migrations via Drizzle
- [x] SQL puro nas queries críticas
- [x] CRUD completo de produtos
- [x] CRUD completo de promoções
- [x] Cardápio consolidado
- [x] Visibilidade de produtos
- [x] Horários de promoções
- [x] Ordenação de produtos (opcional)
- [x] Timezone (opcional)
- [x] Testes automatizados
- [x] Docker e Docker Compose
- [x] README completo
- [x] Documentação de desafios