# 📋 Rotas da API - Documentação Completa

## 🔗 Base URL

```
http://localhost:3000
```

---

## 🏥 Health Check

### GET `/health`

Verifica se a API está online.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T14:00:00.000Z"
}
```

---

## 📦 Produtos

### 1. POST `/products` - Criar Produto

**Request:**
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita",
    "priceCents": 3500,
    "category": "Pratos principais",
    "isVisible": true,
    "sortOrder": 1
  }'
```

**Payload:**
```json
{
  "name": "string (obrigatório, min 1 char)",
  "priceCents": "number (obrigatório, > 0)",
  "category": "string (obrigatório): Entradas | Pratos principais | Sobremesas | Bebidas",
  "isVisible": "boolean (opcional, default: true)",
  "sortOrder": "number (opcional)"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Pizza Margherita",
  "priceCents": 3500,
  "category": "Pratos principais",
  "isVisible": true,
  "sortOrder": 1,
  "createdAt": "2025-10-28T02:00:00.000Z",
  "updatedAt": "2025-10-28T02:00:00.000Z"
}
```

---

### 2. GET `/products` - Listar Produtos

**Request:**
```bash
# Todos os produtos
curl http://localhost:3000/products

# Apenas produtos visíveis
curl "http://localhost:3000/products?visible=true"

# Filtrar por categoria
curl "http://localhost:3000/products?category=Bebidas"
```

**Query Parameters:**
- `visible=true` - Apenas produtos visíveis
- `category=Bebidas` - Filtrar por categoria

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Pizza Margherita",
    "priceCents": 3500,
    "category": "Pratos principais",
    "isVisible": true,
    "sortOrder": 1,
    "createdAt": "2025-10-28T02:00:00.000Z",
    "updatedAt": "2025-10-28T02:00:00.000Z"
  }
]
```

---

### 3. GET `/products/:id` - Buscar Produto por ID

**Request:**
```bash
curl http://localhost:3000/products/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Pizza Margherita",
  "priceCents": 3500,
  "category": "Pratos principais",
  "isVisible": true,
  "sortOrder": 1,
  "createdAt": "2025-10-28T02:00:00.000Z",
  "updatedAt": "2025-10-28T02:00:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": {
    "message": "Product with id 999 not found",
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

---

### 4. PATCH `/products/:id` - Atualizar Produto

**Request:**
```bash
curl -X PATCH http://localhost:3000/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita Grande",
    "priceCents": 4500
  }'
```

**Payload (todos os campos opcionais):**
```json
{
  "name": "string (opcional)",
  "priceCents": "number (opcional, > 0)",
  "category": "string (opcional)",
  "isVisible": "boolean (opcional)",
  "sortOrder": "number (opcional)"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Pizza Margherita Grande",
  "priceCents": 4500,
  "category": "Pratos principais",
  "isVisible": true,
  "sortOrder": 1,
  "createdAt": "2025-10-28T02:00:00.000Z",
  "updatedAt": "2025-10-28T02:01:00.000Z"
}
```

---

### 5. PATCH `/products/:id/visibility` - Alterar Visibilidade

**Request:**
```bash
curl -X PATCH http://localhost:3000/products/1/visibility \
  -H "Content-Type: application/json" \
  -d '{
    "isVisible": false
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Pizza Margherita",
  "priceCents": 3500,
  "category": "Pratos principais",
  "isVisible": false,
  "sortOrder": 1,
  "createdAt": "2025-10-28T02:00:00.000Z",
  "updatedAt": "2025-10-28T02:02:00.000Z"
}
```

---

### 6. DELETE `/products/:id` - Deletar Produto

**Request:**
```bash
curl -X DELETE http://localhost:3000/products/1
```

**Response (204 No Content):** Sem corpo

---

## 🎁 Promoções

### 1. POST `/promotions` - Criar Promoção

**Request:**
```bash
curl -X POST http://localhost:3000/promotions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "description": "Happy Hour - Pizza Promoção",
    "promoPriceCents": 2500,
    "schedules": [
      {
        "dayOfWeek": 3,
        "startTime": "18:00",
        "endTime": "20:00"
      }
    ]
  }'
```

**Payload:**
```json
{
  "productId": "number (obrigatório, > 0)",
  "description": "string (obrigatório, min 1 char)",
  "promoPriceCents": "number (obrigatório, > 0)",
  "schedules": [
    {
      "dayOfWeek": "number (0-6, obrigatório)",
      "startTime": "string (HH:mm, obrigatório)",
      "endTime": "string (HH:mm, obrigatório)"
    }
  ]
}
```

**Dias da Semana:**
- `0` = Domingo
- `1` = Segunda-feira
- `2` = Terça-feira
- `3` = Quarta-feira
- `4` = Quinta-feira
- `5` = Sexta-feira
- `6` = Sábado

**Horários:**
- Formato: `HH:mm`
- Intervalos de 15 minutos: `00`, `15`, `30`, `45`
- Exemplos válidos: `08:00`, `08:15`, `18:30`, `23:45`

**Response (201 Created):**
```json
{
  "id": 1,
  "productId": 1,
  "description": "Happy Hour - Pizza Promoção",
  "promoPriceCents": 2500,
  "createdAt": "2025-10-28T02:00:00.000Z",
  "updatedAt": "2025-10-28T02:00:00.000Z",
  "schedules": [
    {
      "id": 1,
      "dayOfWeek": 3,
      "startTime": "18:00:00",
      "endTime": "20:00:00"
    }
  ]
}
```

---

### 2. GET `/promotions` - Listar Promoções

**Request:**
```bash
# Todas as promoções
curl http://localhost:3000/promotions

# Promoções de um produto específico
curl "http://localhost:3000/promotions?productId=1"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "productId": 1,
    "description": "Happy Hour - Pizza Promoção",
    "promoPriceCents": 2500,
    "createdAt": "2025-10-28T02:00:00.000Z",
    "updatedAt": "2025-10-28T02:00:00.000Z",
    "schedules": [
      {
        "id": 1,
        "dayOfWeek": 3,
        "startTime": "18:00:00",
        "endTime": "20:00:00"
      }
    ]
  }
]
```

---

### 3. GET `/promotions/:id` - Buscar Promoção por ID

**Request:**
```bash
curl http://localhost:3000/promotions/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "productId": 1,
  "description": "Happy Hour - Pizza Promoção",
  "promoPriceCents": 2500,
  "createdAt": "2025-10-28T02:00:00.000Z",
  "updatedAt": "2025-10-28T02:00:00.000Z",
  "schedules": [
    {
      "id": 1,
      "dayOfWeek": 3,
      "startTime": "18:00:00",
      "endTime": "20:00:00"
    }
  ]
}
```

---

### 4. PATCH `/promotions/:id` - Atualizar Promoção

**Request:**
```bash
curl -X PATCH http://localhost:3000/promotions/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Super Happy Hour - Pizza 40% OFF",
    "promoPriceCents": 2000,
    "schedules": [
      {
        "dayOfWeek": 3,
        "startTime": "18:00",
        "endTime": "21:00"
      }
    ]
  }'
```

**Payload (campos opcionais):**
```json
{
  "description": "string (opcional)",
  "promoPriceCents": "number (opcional, > 0)",
  "schedules": "array (opcional)"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "productId": 1,
  "description": "Super Happy Hour - Pizza 40% OFF",
  "promoPriceCents": 2000,
  "createdAt": "2025-10-28T02:00:00.000Z",
  "updatedAt": "2025-10-28T02:03:00.000Z",
  "schedules": [
    {
      "id": 1,
      "dayOfWeek": 3,
      "startTime": "18:00:00",
      "endTime": "21:00:00"
    }
  ]
}
```

**Nota:** Atualizar `schedules` remove todos os horários antigos e cria os novos.

---

### 5. DELETE `/promotions/:id` - Deletar Promoção

**Request:**
```bash
curl -X DELETE http://localhost:3000/promotions/1
```

**Response (204 No Content):** Sem corpo

---

## 🍽️ Menu

### GET `/menu` - Cardápio Consolidado

Retorna o cardápio completo com promoções ativas aplicadas automaticamente baseado no horário atual.

**Request:**
```bash
# Timezone padrão (America/Sao_Paulo)
curl http://localhost:3000/menu

# Timezone customizado
curl "http://localhost:3000/menu?tz=America/New_York"
curl "http://localhost:3000/menu?tz=Europe/London"
```

**Query Parameters:**
- `tz=America/Sao_Paulo` - Timezone (default: America/Sao_Paulo)

**Response (200 OK):**
```json
{
  "items": [
    {
      "productId": 1,
      "productName": "Pizza Margherita",
      "productCategory": "Pratos principais",
      "sortOrder": 1,
      "originalPriceCents": 3500,
      "isPromotionActive": true,
      "promotionId": 1,
      "promotionDescription": "Happy Hour - Pizza Promoção",
      "finalPriceCents": 2500
    },
    {
      "productId": 2,
      "productName": "Chopp",
      "productCategory": "Bebidas",
      "sortOrder": null,
      "originalPriceCents": 1200,
      "isPromotionActive": false,
      "promotionId": null,
      "promotionDescription": null,
      "finalPriceCents": 1200
    }
  ]
}
```

**Campos:**
- `productId` - ID do produto
- `productName` - Nome do produto
- `productCategory` - Categoria
- `sortOrder` - Ordem de exibição
- `originalPriceCents` - Preço original
- `isPromotionActive` - Promoção ativa agora?
- `promotionId` - ID da promoção ativa (ou null)
- `promotionDescription` - Descrição da promoção (ou null)
- `finalPriceCents` - Preço final (promoção ou original)

**Como Funciona:**
- ✅ Retorna apenas produtos visíveis
- ✅ Verifica promoções ativas no horário atual (timezone)
- ✅ Seleciona a promoção com menor preço se houver múltiplas
- ✅ Ordena por categoria → sortOrder → nome

---

## ❌ Erros Comuns

### 400 Bad Request - Validação

```json
{
  "error": {
    "message": "Invalid input data",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "priceCents": ["Expected number, received string"]
    }
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "message": "Product with id 999 not found",
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

### 409 Conflict - Preço Promocional Inválido

```json
{
  "error": {
    "message": "Promo price must be lower than product price",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

---

## 📝 Exemplos Completos

### Criar um Cardápio Completo

```bash
# 1. Criar Entrada
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Bruschetta","priceCents":1200,"category":"Entradas","isVisible":true,"sortOrder":1}'

# 2. Criar Prato Principal
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza Margherita","priceCents":3500,"category":"Pratos principais","isVisible":true,"sortOrder":1}'

# 3. Criar Bebida
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Chopp Artesanal","priceCents":1200,"category":"Bebidas","isVisible":true,"sortOrder":1}'

# 4. Criar Promoção
curl -X POST http://localhost:3000/promotions \
  -H "Content-Type: application/json" \
  -d '{
    "productId":2,
    "description":"Happy Hour - Pizza 30% OFF",
    "promoPriceCents":2500,
    "schedules":[{"dayOfWeek":3,"startTime":"18:00","endTime":"20:00"}]
  }'

# 5. Ver Cardápio
curl http://localhost:3000/menu
```

---

## 🎯 Ordenação de Produtos

O campo `sortOrder` permite controlar a ordem dos produtos no cardápio:

1. **Por categoria**: Entradas → Pratos principais → Sobremesas → Bebidas
2. **Por sortOrder**: Menor valor primeiro dentro da categoria
3. **Por nome**: Alfabético quando sortOrder é igual ou null

Produtos sem `sortOrder` vão para o final da categoria.

---

## 🌍 Timezone

A rota `/menu` aceita o parâmetro `tz` para ajustar o horário das promoções:

```bash
# São Paulo (padrão)
curl http://localhost:3000/menu

# Nova York
curl "http://localhost:3000/menu?tz=America/New_York"

# Londres
curl "http://localhost:3000/menu?tz=Europe/London"

# Tóquio
curl "http://localhost:3000/menu?tz=Asia/Tokyo"
```

As promoções são ativadas baseadas no horário local do timezone informado.


