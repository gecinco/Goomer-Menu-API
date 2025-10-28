import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import dbPlugin from "../../src/app/plugins/db";
import promotionRoutes from "../../src/modules/promotions/promotion.routes";
import productRoutes from "../../src/modules/products/product.routes";
import { startTestDb, TestDbHandle } from "../utils/test-db";

describe("Promotions API", () => {
  const app = Fastify({ logger: false });

  beforeAll(async () => {
    const handle: TestDbHandle = await startTestDb();
    (globalThis as any).__TEST_DB__ = handle;
    process.env.DATABASE_URL = handle.databaseUrl;
    await app.register(dbPlugin);
    await app.register(productRoutes, { prefix: "/products" });
    await app.register(promotionRoutes, { prefix: "/promotions" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    const handle: TestDbHandle = (globalThis as any).__TEST_DB__;
    if (handle) await handle.stop();
  });

  describe("POST /promotions", () => {
    it("should create a promotion", async () => {
      // First create a product
      const productResponse = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Test Product for Promotion",
          priceCents: 1500,
          category: "Bebidas",
          isVisible: true,
        },
      });

      const product = JSON.parse(productResponse.body);

      const response = await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Happy Hour",
          promoPriceCents: 800,
          schedules: [
            {
              dayOfWeek: 3,
              startTime: "18:00",
              endTime: "20:00",
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.description).toBe("Happy Hour");
      expect(body.schedules).toHaveLength(1);
    });

    it("should reject invalid time format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: 1,
          description: "Test Promotion",
          promoPriceCents: 800,
          schedules: [
            {
              dayOfWeek: 3,
              startTime: "18:10",
              endTime: "20:00",
            },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should reject promo price >= product price", async () => {
      // Create a product
      const productResp = await app.inject({
        method: "POST",
        url: "/products",
        payload: { name: "Price Ref Prod", priceCents: 1000, category: "Bebidas", isVisible: true },
      });
      const product = JSON.parse(productResp.body);

      // Try create promotion with bad price
      const response = await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Bad Promo",
          promoPriceCents: 1000,
          schedules: [{ dayOfWeek: 3, startTime: "18:00", endTime: "20:00" }],
        },
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /promotions", () => {
    it("should list all promotions", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/promotions",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
    });

    it("should filter by product id", async () => {
      // Create product and promo
      const productResp = await app.inject({
        method: "POST",
        url: "/products",
        payload: { name: "Filter Prod", priceCents: 2000, category: "Bebidas", isVisible: true },
      });
      const product = JSON.parse(productResp.body);
      await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Promo",
          promoPriceCents: 1500,
          schedules: [{ dayOfWeek: 3, startTime: "18:00", endTime: "20:00" }],
        },
      });

      const response = await app.inject({ method: "GET", url: "/promotions", query: { productId: String(product.id) } });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.every((p: any) => p.productId === product.id)).toBe(true);
    });
  });

  describe("PATCH /promotions/:id", () => {
    it("should reject increasing promo price to >= product price", async () => {
      // Create product and promo
      const productResp = await app.inject({
        method: "POST",
        url: "/products",
        payload: { name: "Patch Price Prod", priceCents: 3000, category: "Bebidas", isVisible: true },
      });
      const product = JSON.parse(productResp.body);
      const promoResp = await app.inject({
        method: "POST",
        url: "/promotions",
        payload: {
          productId: product.id,
          description: "Patch Promo",
          promoPriceCents: 1000,
          schedules: [{ dayOfWeek: 3, startTime: "18:00", endTime: "20:00" }],
        },
      });
      const promo = JSON.parse(promoResp.body);

      const badPatch = await app.inject({
        method: "PATCH",
        url: `/promotions/${promo.id}`,
        payload: { promoPriceCents: 3000 },
      });
      expect(badPatch.statusCode).toBe(400);
    });
  });
});

