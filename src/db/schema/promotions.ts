import { pgTable, serial, integer, text, time, timestamp } from "drizzle-orm/pg-core";
import { products } from "./products";

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  promoPriceCents: integer("promo_price_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const promotionSchedules = pgTable("promotion_schedules", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id")
    .references(() => promotions.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

