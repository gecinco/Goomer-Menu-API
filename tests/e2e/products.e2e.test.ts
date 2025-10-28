import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import dbPlugin from "../../src/app/plugins/db";
import productRoutes from "../../src/modules/products/product.routes";
import { startTestDb, TestDbHandle } from "../utils/test-db";

describe("Products API", () => {
  const app = Fastify({ logger: false });
  let handle: TestDbHandle;

  beforeAll(async () => {
    handle = await startTestDb();
    process.env.DATABASE_URL = handle.databaseUrl;
    await app.register(dbPlugin);
    await app.register(productRoutes, { prefix: "/products" });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    if (handle) {
      await handle.stop();
    }
  });

  describe("POST /products", () => {
    it("should create a product", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Test Product",
          priceCents: 1000,
          category: "Bebidas",
          isVisible: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe("Test Product");
      expect(body.priceCents).toBe(1000);
      expect(body.category).toBe("Bebidas");
    });

    it("should reject invalid category", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/products",
        payload: {
          name: "Test Product",
          priceCents: 1000,
          category: "Invalid Category",
          isVisible: true,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /products", () => {
    it("should list all products", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/products",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("GET /products/:id - not found", () => {
    it("should return 404 for non-existing product", async () => {
      const response = await app.inject({ method: "GET", url: "/products/999999" });
      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /products/:id", () => {
    it("should return 404 when updating non-existing product", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/products/999999",
        payload: { name: "Nope" },
      });
      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /products/:id/visibility", () => {
    it("should toggle visibility and reflect in listing filter", async () => {
      // create product visible
      const created = await app.inject({
        method: "POST",
        url: "/products",
        payload: { name: "Toggle Test", priceCents: 500, category: "Bebidas", isVisible: true },
      });
      const product = JSON.parse(created.body);

      // hide it
      const visResp = await app.inject({
        method: "PATCH",
        url: `/products/${product.id}/visibility`,
        payload: { isVisible: false },
      });
      expect(visResp.statusCode).toBe(200);
      const updated = JSON.parse(visResp.body);
      expect(updated.isVisible).toBe(false);

      // list only visible should exclude it
      const listVisible = await app.inject({ method: "GET", url: "/products", query: { visible: "true" } });
      const listVisibleBody = JSON.parse(listVisible.body);
      expect(listVisibleBody.find((p: any) => p.id === product.id)).toBeUndefined();
    });
  });

  describe("DELETE /products/:id", () => {
    it("should delete a product", async () => {
      const created = await app.inject({
        method: "POST",
        url: "/products",
        payload: { name: "Delete Me", priceCents: 700, category: "Bebidas", isVisible: true },
      });
      const product = JSON.parse(created.body);

      const del = await app.inject({ method: "DELETE", url: `/products/${product.id}` });
      expect(del.statusCode).toBe(204);

      const getAfter = await app.inject({ method: "GET", url: `/products/${product.id}` });
      expect(getAfter.statusCode).toBe(404);
    });
  });
});

