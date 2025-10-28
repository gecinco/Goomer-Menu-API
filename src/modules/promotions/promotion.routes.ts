import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createPromotionSchema, updatePromotionSchema } from "./promotion.types";
import { PromotionRepository } from "./promotion.repository";
import { ValidationError, NotFoundError } from "../../shared/errors/api-error";
import { sql } from "drizzle-orm";

const routes: FastifyPluginAsync = async (app) => {
  const repo = new PromotionRepository(app.db);

  app.post("/", async (req, reply) => {
    const parsed = createPromotionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input data", parsed.error.flatten());
    }

    // Business rule: promo price must be lower than product price
    const productResult = await app.db.execute(
      sql`SELECT price_cents FROM products WHERE id = ${parsed.data.productId}`
    );
    const product = productResult.rows[0] as { price_cents: number } | undefined;
    if (!product) {
      throw new NotFoundError("Product", parsed.data.productId);
    }
    if (parsed.data.promoPriceCents >= product.price_cents) {
      throw new ValidationError("Promo price must be lower than product price");
    }

    const promotion = await repo.create({ ...parsed.data });

    return reply.code(201).send(promotion);
  });

  app.get("/", async (req, reply) => {
    const querySchema = z.object({
      productId: z.string().regex(/^\d+$/).optional(),
    });
    const parse = querySchema.safeParse(req.query);
    
    if (!parse.success) {
      throw new ValidationError("Invalid query parameters", parse.error.flatten());
    }

    const productId = parse.data.productId
      ? Number(parse.data.productId)
      : undefined;

    const promotions = await repo.list(productId);
    return reply.send(promotions);
  });

  app.get("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(req.params);
    if (!params.success) {
      throw new ValidationError("Invalid promotion ID");
    }
    
    const promotion = await repo.findById(Number(params.data.id));
    
    if (!promotion) {
      throw new NotFoundError("Promotion", params.data.id);
    }

    return reply.send(promotion);
  });

  app.patch("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(req.params);
    if (!params.success) {
      throw new ValidationError("Invalid promotion ID");
    }
    
    const body = updatePromotionSchema.safeParse(req.body);
    if (!body.success) {
      throw new ValidationError("Invalid update data", body.error.flatten());
    }
    
    if (body.data.promoPriceCents !== undefined) {
      // Validate against current product price
      const promo = (await repo.findById(Number(params.data.id))) as
        | { productId: number }
        | null;
      if (!promo) {
        throw new NotFoundError("Promotion", params.data.id);
      }
      const productResult = await app.db.execute(
        sql`SELECT price_cents FROM products WHERE id = ${promo.productId}`
      );
      const product = productResult.rows[0] as { price_cents: number } | undefined;
      if (product && body.data.promoPriceCents >= product.price_cents) {
        throw new ValidationError("Promo price must be lower than product price");
      }
    }

    const updated = await repo.update(Number(params.data.id), body.data);
    
    if (!updated) {
      throw new NotFoundError("Promotion", params.data.id);
    }

    return reply.send(updated);
  });

  app.delete("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(req.params);
    if (!params.success) {
      throw new ValidationError("Invalid promotion ID");
    }
    
    await repo.delete(Number(params.data.id));
    return reply.code(204).send();
  });
};

export default routes;

