import { z } from "zod";
import { hhmmSchema } from "../products/product.types";

export const scheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: hhmmSchema,
    endTime: hhmmSchema,
  })
  .refine(
    (s) => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return end > start && end - start >= 15;
    },
    {
      message: "endTime must be greater than startTime with at least 15 minutes",
      path: ["endTime"],
    }
  );

export const createPromotionSchema = z.object({
  productId: z.number().int().positive(),
  description: z.string().min(1),
  promoPriceCents: z.number().int().positive(),
  schedules: z.array(scheduleSchema).min(1),
});

export const updatePromotionSchema = z
  .object({
    description: z.string().min(1).optional(),
    promoPriceCents: z.number().int().positive().optional(),
    schedules: z.array(scheduleSchema).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;

