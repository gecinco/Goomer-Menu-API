import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createProductSchema, updateProductSchema } from "./product.types";
import { ProductRepository } from "./product.repository";
import { ValidationError, NotFoundError } from "../../shared/errors/api-error";

const routes: FastifyPluginAsync = async (app) => {
  const repo = new ProductRepository(app.db);

  app.post("/", async (req, reply) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid input data", parsed.error.flatten());
    }

    const product = await repo.create({
      ...parsed.data,
      isVisible: parsed.data.isVisible ?? true,
      sortOrder: parsed.data.sortOrder ?? null,
    });

    return reply.code(201).send(product);
  });

  app.get("/", async (req, reply) => {
    const querySchema = z.object({
      visible: z.enum(["true", "false"]).optional(),
      category: z.string().optional(),
    });
    const parse = querySchema.safeParse(req.query);
    if (!parse.success) {
      throw new ValidationError("Invalid query parameters", parse.error.flatten());
    }

    const filters = {
      onlyVisible: parse.data.visible === "true",
      category: parse.data.category,
    };

    const products = await repo.list(filters);
    return reply.send(products);
  });

  app.get("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(req.params);
    if (!params.success) {
      throw new ValidationError("Invalid product ID");
    }
    
    const product = await repo.findById(Number(params.data.id));
    
    if (!product) {
      throw new NotFoundError("Product", params.data.id);
    }

    return reply.send(product);
  });

  app.patch("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(req.params);
    if (!params.success) {
      throw new ValidationError("Invalid product ID");
    }
    
    const body = updateProductSchema.safeParse(req.body);
    if (!body.success) {
      throw new ValidationError("Invalid update data", body.error.flatten());
    }
    
    const updated = await repo.update(Number(params.data.id), body.data);
    
    if (!updated) {
      throw new NotFoundError("Product", params.data.id);
    }

    return reply.send(updated);
  });

  app.patch("/:id/visibility", async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(req.params);
    if (!params.success) {
      throw new ValidationError("Invalid product ID");
    }
    
    const body = z.object({ isVisible: z.boolean() }).safeParse(req.body);
    if (!body.success) {
      throw new ValidationError("Invalid visibility data", body.error.flatten());
    }
    
    const updated = await repo.update(Number(params.data.id), { isVisible: body.data.isVisible });
    
    if (!updated) {
      throw new NotFoundError("Product", params.data.id);
    }

    return reply.send(updated);
  });

  app.delete("/:id", async (req, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(req.params);
    if (!params.success) {
      throw new ValidationError("Invalid product ID");
    }
    
    await repo.delete(Number(params.data.id));
    return reply.code(204).send();
  });
};

export default routes;

