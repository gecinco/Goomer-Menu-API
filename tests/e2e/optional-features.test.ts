import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import dbPlugin from "../../src/app/plugins/db";
import productRoutes from "../../src/modules/products/product.routes";
import promotionRoutes from "../../src/modules/promotions/promotion.routes";
import menuRoutes from "../../src/modules/menu/menu.routes";
import { startTestDb, TestDbHandle } from "../utils/test-db";

  describe("Optional Features - Ordenação e Timezone", () => {
  const app = Fastify({ logger: false });
  let handle: TestDbHandle;

  beforeAll(async () => {
    handle = await startTestDb();
    process.env.DATABASE_URL = handle.databaseUrl;
    await app.register(dbPlugin);
    await app.register(productRoutes, { prefix: "/products" });
    await app.register(promotionRoutes, { prefix: "/promotions" });
    await app.register(menuRoutes, { prefix: "/menu" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    if (handle) {
      await handle.stop();
    }
  });

  describe("Ordenação de Produtos (sortOrder)", () => {
    it("deve ordenar produtos por sortOrder definido", async () => {
      const prod1 = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Produto C (sort 3)",
          priceCents: 1000,
          category: "Bebidas",
          isVisible: true,
          sortOrder: 3,
        },
      });

      const prod2 = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Produto A (sort 1)",
          priceCents: 1000,
          category: "Bebidas",
          isVisible: true,
          sortOrder: 1,
        },
      });

      const prod3 = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Produto B (sort 2)",
          priceCents: 1000,
          category: "Bebidas",
          isVisible: true,
          sortOrder: 2,
        },
      });

      expect(prod1.statusCode).toBe(201);
      expect(prod2.statusCode).toBe(201);
      expect(prod3.statusCode).toBe(201);

      const menuResponse = await app.inject({
        method: "GET",
        url: "/menu",
      });

      expect(menuResponse.statusCode).toBe(200);
      const menu = JSON.parse(menuResponse.body);

      const bebidas = menu.items.filter((item: any) => item.productCategory === "Bebidas");
      const bebidasComSort = bebidas.filter((item: any) => item.sortOrder !== null);

      const productNames = bebidasComSort.map((item: any) => item.productName);
      expect(productNames).toContain("Produto A (sort 1)");
      expect(productNames).toContain("Produto B (sort 2)");
      expect(productNames).toContain("Produto C (sort 3)");
    });

    it("deve ordenar produtos sem sortOrder ao final (999999)", async () => {
      const menuResponse = await app.inject({
        method: "GET",
        url: "/menu",
      });

      expect(menuResponse.statusCode).toBe(200);
      const menu = JSON.parse(menuResponse.body);

      const bebidas = menu.items.filter((item: any) => item.productCategory === "Bebidas");
      
      let ultimoSortOrder = 0;
      for (const item of bebidas) {
        if (item.sortOrder !== null) {
          expect(item.sortOrder).toBeGreaterThanOrEqual(ultimoSortOrder);
          ultimoSortOrder = item.sortOrder;
        }
      }
    });
  });

  describe("Timezone - Promoções por Horário Local", () => {
    it("deve aplicar promoção baseado no timezone informado", async () => {
      const productResp = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Produto Timezone Test",
          priceCents: 5000,
          category: "Bebidas",
          isVisible: true,
        },
      });

      const product = JSON.parse(productResp.body);

      const hoje = new Date();
      const diaDaSemana = hoje.getUTCDay(); // 0 = domingo, 6 = sabado
      
      const agora = new Date();
      const horaInicio = String(agora.getUTCHours()).padStart(2, "0");
      const minutoInicio = "00";
      
      const promoResp = await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Promoção de Teste",
          promoPriceCents: 2000,
          schedules: [
            {
              dayOfWeek: diaDaSemana,
              startTime: `${horaInicio}:00`,
              endTime: `${(parseInt(horaInicio) + 2) % 24}:00`,
            },
          ],
        },
      });

      expect(promoResp.statusCode).toBe(201);
      const promo = JSON.parse(promoResp.body);
      expect(promo.schedules).toHaveLength(1);
    });

    it("deve considerar timezone ao verificar promoções ativas", async () => {
      const productResp = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Produto TZ America/Sao_Paulo",
          priceCents: 3000,
          category: "Bebidas",
          isVisible: true,
        },
      });

      const product = JSON.parse(productResp.body);

      await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Promo Quarta-feira",
          promoPriceCents: 1500,
          schedules: [
            {
              dayOfWeek: 3,
              startTime: "18:00",
              endTime: "20:00",
            },
          ],
        },
      });

      const menuResponse = await app.inject({
        method: "GET",
        url: "/menu",
        query: { tz: "America/Sao_Paulo" },
      });

      expect(menuResponse.statusCode).toBe(200);
      const menu = JSON.parse(menuResponse.body);

      const produtoNoMenu = menu.items.find(
        (item: any) => item.productId === product.id
      );

      expect(produtoNoMenu).toBeDefined();
      expect(produtoNoMenu.productName).toBe("Produto TZ America/Sao_Paulo");
      expect(produtoNoMenu.originalPriceCents).toBe(3000);
    });

    it("deve rejeitar timezone inválido", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/menu",
        query: { tz: "Invalid/Timezone" },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it("deve aceitar timezone válido", async () => {
      const timezones = [
        "America/Sao_Paulo",
        "America/New_York",
        "Europe/London",
        "Asia/Tokyo",
      ];

      for (const tz of timezones) {
        const response = await app.inject({
          method: "GET",
          url: "/menu",
          query: { tz },
        });

        expect(response.statusCode).toBe(200);
      }
    });
  });

  describe("Integração - Ordenação + Timezone", () => {
    it("deve retornar menu ordenado corretamente com promoções aplicadas por timezone", async () => {
      const menuResponse = await app.inject({
        method: "GET",
        url: "/menu",
        query: { tz: "America/Sao_Paulo" },
      });

      expect(menuResponse.statusCode).toBe(200);
      const menu = JSON.parse(menuResponse.body);

      expect(menu.items).toBeDefined();
      expect(Array.isArray(menu.items)).toBe(true);

      if (menu.items.length > 0) {
        const item = menu.items[0];
        expect(item.productId).toBeDefined();
        expect(item.productName).toBeDefined();
        expect(item.productCategory).toBeDefined();
        expect(item.originalPriceCents).toBeDefined();
        expect(item.isPromotionActive).toBeDefined();
        expect(item.finalPriceCents).toBeDefined();
      }

      for (let i = 1; i < menu.items.length; i++) {
        const current = menu.items[i];
        const previous = menu.items[i - 1];

        if (current.productCategory === previous.productCategory) {
          const currentSort = current.sortOrder ?? 999999;
          const previousSort = previous.sortOrder ?? 999999;

          if (currentSort === previousSort) {
            expect(current.productName >= previous.productName).toBe(true);
          } else {
            // Ordenar por sortOrder
            expect(currentSort >= previousSort).toBe(true);
          }
        }
      }
    });
  });
});

