import { z } from "zod";

export const categoryEnum = z.enum([
  "Entradas",
  "Pratos principais",
  "Sobremesas",
  "Bebidas",
]);

export const hhmmSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .refine(
    (val) => {
      const [hh, mm] = val.split(":").map(Number);
      return hh >= 0 && hh <= 23 && [0, 15, 30, 45].includes(mm);
    },
    "Time must be in HH:mm format with 15-minute intervals"
  );

export const createProductSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().positive(),
  category: categoryEnum,
  isVisible: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  priceCents: z.number().int().positive().optional(),
  category: categoryEnum.optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

