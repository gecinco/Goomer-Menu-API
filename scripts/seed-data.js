// Script multiplataforma para popular o banco com dados de teste
// Execute: node scripts/seed-data.js

const http = require('http');

const API_URL = 'http://localhost:3000';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createProduct(name, priceCents, category, sortOrder) {
  try {
    const product = await makeRequest('POST', '/products', {
      name,
      priceCents,
      category,
      isVisible: true,
      sortOrder,
    });
    console.log(`${name} criado (ID: ${product.id})`);
    return product;
  } catch (error) {
    console.log(`Erro ao criar ${name}:`, error.message);
    return null;
  }
}

async function createPromotion(productId, description, promoPriceCents, schedules) {
  try {
    const promotion = await makeRequest('POST', '/promotions', {
      productId,
      description,
      promoPriceCents,
      schedules,
    });
    console.log(`${description} criada (ID: ${promotion.id})`);
    return promotion;
  } catch (error) {
    console.log(`Erro ao criar promoção ${description}:`, error.message);
    return null;
  }
}

async function seed() {
  const entrada1 = await createProduct('Bruschetta', 1200, 'Entradas', 1);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const entrada2 = await createProduct('Salada Caprese', 1800, 'Entradas', 2);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const entrada3 = await createProduct('Azeitonas e Conservas', 900, 'Entradas', 3);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const prato1 = await createProduct('Pizza Margherita', 3500, 'Pratos principais', 1);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const prato2 = await createProduct('Pizza Calabresa', 3800, 'Pratos principais', 2);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const prato3 = await createProduct('Risotto de Cogumelos', 4200, 'Pratos principais', 3);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const bebida1 = await createProduct('Chopp Artesanal', 1200, 'Bebidas', 1);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const bebida2 = await createProduct('Refrigerante Lata', 800, 'Bebidas', 2);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const bebida3 = await createProduct('Suco Natural', 1000, 'Bebidas', 3);
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  if (entrada1) {
    await createPromotion(entrada1.id, 'Happy Hour - Bruschetta 30% OFF', 900, [
      { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (prato1) {
    await createPromotion(prato1.id, 'Happy Hour - Pizza 40% OFF', 2100, [
      { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '18:00', endTime: '20:00' },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (bebida1) {
    await createPromotion(bebida1.id, 'Happy Hour - Chopp 2x1', 600, [
      { dayOfWeek: 5, startTime: '17:00', endTime: '19:00' },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log('\nDados de teste criados com sucesso!');
}

seed().catch((error) => {
  console.error('Erro ao popular banco:', error);
  process.exit(1);
});

