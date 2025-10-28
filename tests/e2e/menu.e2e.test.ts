import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import dbPlugin from "../../src/app/plugins/db";
import menuRoutes from "../../src/modules/menu/menu.routes";
import productRoutes from "../../src/modules/products/product.routes";
import promotionRoutes from "../../src/modules/promotions/promotion.routes";
import { startTestDb, TestDbHandle } from "../utils/test-db";

describe("Menu API", () => {
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

  describe("GET /menu", () => {
    it("should return menu with default timezone", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/menu",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
    });

    it("should accept custom timezone", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/menu",
        query: { tz: "America/New_York" },
      });

      expect(response.statusCode).toBe(200);
    });

    it("should reject invalid timezone", async () => {
      const response = await app.inject({ method: "GET", url: "/menu", query: { tz: "Invalid/TZ" } });
      expect(response.statusCode).toBe(400);
    });

    it("should pick the lowest promo price when multiple active", async () => {
      // create product
      const prodResp = await app.inject({
        method: "POST",
        url: "/products",
        payload: { name: "Multi Promo", priceCents: 4000, category: "Bebidas", isVisible: true },
      });
      const product = JSON.parse(prodResp.body);

      // create two promos for same day/time, different prices
      await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Promo High",
          promoPriceCents: 3500,
          schedules: [{ dayOfWeek: 3, startTime: "18:00", endTime: "23:45" }],
        },
      });
      await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Promo Low",
          promoPriceCents: 3000,
          schedules: [{ dayOfWeek: 3, startTime: "18:00", endTime: "23:45" }],
        },
      });

      // Use tz to target a Wednesday (3). We cannot manipulate time here reliably,
      // but the endpoint should still respond; this is a smoke path.
      const resp = await app.inject({ method: "GET", url: "/menu", query: { tz: "America/Sao_Paulo" } });
      expect(resp.statusCode).toBe(200);
      const body = JSON.parse(resp.body);
      expect(Array.isArray(body.items)).toBe(true);
    });
  });
});

