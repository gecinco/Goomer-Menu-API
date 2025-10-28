import { sql } from "drizzle-orm";
import type { Database } from "../../shared/types/db.types";
import type { PromotionRow, PromotionScheduleRow } from "../../shared/types/product.types";

export interface PromotionWithSchedules {
  id: number;
  productId: number;
  description: string;
  promoPriceCents: number;
  createdAt: Date;
  updatedAt: Date;
  schedules: PromotionScheduleRow[];
}

export class PromotionRepository {
  constructor(private readonly db: Database) {}

  async create(input: {
    productId: number;
    description: string;
    promoPriceCents: number;
    schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
  }): Promise<PromotionWithSchedules> {
    return this.db.transaction(async (tx: any) => {
      const promo = await tx.execute(
        sql`
          INSERT INTO promotions (product_id, description, promo_price_cents)
          VALUES (${input.productId}, ${input.description}, ${input.promoPriceCents})
          RETURNING 
            id, 
            product_id AS "productId", 
            description, 
            promo_price_cents AS "promoPriceCents",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `
      );
      const promotion = promo.rows[0] as PromotionRow;

      for (const schedule of input.schedules) {
        await tx.execute(
          sql`
            INSERT INTO promotion_schedules (promotion_id, day_of_week, start_time, end_time)
            VALUES (${promotion.id}, ${schedule.dayOfWeek}, ${schedule.startTime}::time, ${schedule.endTime}::time)
          `
        );
      }

      // Return promotion with schedules
      const schedulesResult = await tx.execute(
        sql`
          SELECT 
            id,
            day_of_week AS "dayOfWeek",
            start_time AS "startTime",
            end_time AS "endTime"
          FROM promotion_schedules
          WHERE promotion_id = ${promotion.id}
          ORDER BY day_of_week, start_time
        `
      );

      return {
        ...promotion,
        schedules: schedulesResult.rows,
      };
    });
  }

  async findById(id: number) {
    const promoResult = await this.db.execute(
      sql`
        SELECT 
          id, 
          product_id AS "productId", 
          description, 
          promo_price_cents AS "promoPriceCents",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM promotions
        WHERE id = ${id}
      `
    );

    if (!promoResult.rows[0]) return null;

    const schedulesResult = await this.db.execute(
      sql`
        SELECT 
          id,
          day_of_week AS "dayOfWeek",
          start_time AS "startTime",
          end_time AS "endTime"
        FROM promotion_schedules
        WHERE promotion_id = ${id}
        ORDER BY day_of_week, start_time
      `
    );

    return {
      ...promoResult.rows[0],
      schedules: schedulesResult.rows,
    };
  }

  async list(productId?: number) {
    let whereClause = sql``;
    if (productId) {
      whereClause = sql`WHERE p.product_id = ${productId}`;
    }

    const result = await this.db.execute(
      sql`
        SELECT 
          p.id, 
          p.product_id AS "productId", 
          p.description, 
          p.promo_price_cents AS "promoPriceCents",
          p.created_at AS "createdAt",
          p.updated_at AS "updatedAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', s.id,
                'dayOfWeek', s.day_of_week, 
                'startTime', s.start_time, 
                'endTime', s.end_time
              ) 
              ORDER BY s.day_of_week, s.start_time
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'::json
          ) AS schedules
        FROM promotions p
        LEFT JOIN promotion_schedules s ON s.promotion_id = p.id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.id DESC
      `
    );
    return result.rows;
  }

  async update(
    id: number,
    data: Partial<{
      description: string;
      promoPriceCents: number;
      schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
    }>
  ) {
    return this.db.transaction(async (tx: any) => {
      // Update promotion fields
      const sets: any[] = [];
      if (data.description !== undefined) {
        sets.push(sql`description = ${data.description}`);
      }
      if (data.promoPriceCents !== undefined) {
        sets.push(sql`promo_price_cents = ${data.promoPriceCents}`);
      }

      if (sets.length > 0) {
        await tx.execute(
          sql`
            UPDATE promotions
            SET ${sql.join([...sets, sql`updated_at = NOW()`], sql`, `)}
            WHERE id = ${id}
          `
        );
      }

      // Update schedules if provided
      if (data.schedules && data.schedules.length > 0) {
        // Delete old schedules
        await tx.execute(
          sql`DELETE FROM promotion_schedules WHERE promotion_id = ${id}`
        );

        // Insert new schedules
        const values = data.schedules.map(
          (s, idx) =>
            sql`(${id}, ${s.dayOfWeek}, ${s.startTime}::time, ${s.endTime}::time)`
        );

        if (values.length > 0) {
          await tx.execute(
            sql`INSERT INTO promotion_schedules (promotion_id, day_of_week, start_time, end_time) VALUES ${sql.join(values, sql`, `)}`
          );
        }
      }

      // Fetch updated promotion within transaction
      const promoResult = await tx.execute(
        sql`
          SELECT 
            id, 
            product_id AS "productId", 
            description, 
            promo_price_cents AS "promoPriceCents",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM promotions
          WHERE id = ${id}
        `
      );

      if (!promoResult.rows[0]) return null;

      const schedulesResult = await tx.execute(
        sql`
          SELECT 
            id,
            day_of_week AS "dayOfWeek",
            start_time AS "startTime",
            end_time AS "endTime"
          FROM promotion_schedules
          WHERE promotion_id = ${id}
          ORDER BY day_of_week, start_time
        `
      );

      return {
        ...(promoResult.rows[0] as PromotionRow),
        schedules: schedulesResult.rows as PromotionScheduleRow[],
      };
    });
  }

  async delete(id: number) {
    await this.db.transaction(async (tx: any) => {
      await tx.execute(
        sql`DELETE FROM promotion_schedules WHERE promotion_id = ${id}`
      );
      await tx.execute(sql`DELETE FROM promotions WHERE id = ${id}`);
    });
  }
}

