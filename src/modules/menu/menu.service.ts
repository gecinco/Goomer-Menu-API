import { sql } from "drizzle-orm";
import type { Database } from "../../shared/types/db.types";
import type { MenuItem } from "../../shared/types/product.types";

export class MenuService {
  constructor(private readonly db: Database) {}

  async getMenu(timezone: string): Promise<MenuItem[]> {
    const result = await this.db.execute(
      sql`
        WITH now_local AS (
          SELECT (now() AT TIME ZONE ${timezone}) AS ts_local
        ),
        base AS (
          SELECT 
            id, 
            name, 
            price_cents, 
            category, 
            is_visible, 
            sort_order
          FROM products
          WHERE is_visible = TRUE
        ),
        active_promos AS (
          SELECT 
            p.id AS promotion_id,
            p.product_id, 
            p.description AS promotion_description,
            p.promo_price_cents, 
            TRUE AS is_active
          FROM promotions p
          JOIN promotion_schedules s ON s.promotion_id = p.id
          CROSS JOIN now_local nl
          WHERE EXTRACT(DOW FROM nl.ts_local)::int = s.day_of_week
            AND CAST(nl.ts_local::time AS time) >= s.start_time
            AND CAST(nl.ts_local::time AS time) < s.end_time
        )
        SELECT
          b.id AS "productId",
          b.name AS "productName",
          b.category AS "productCategory",
          b.sort_order AS "sortOrder",
          b.price_cents AS "originalPriceCents",
          COALESCE(ap.is_active, FALSE) AS "isPromotionActive",
          ap.promotion_id AS "promotionId",
          ap.promotion_description AS "promotionDescription",
          CASE 
            WHEN COALESCE(ap.is_active, FALSE) THEN ap.promo_price_cents 
            ELSE b.price_cents 
          END AS "finalPriceCents"
        FROM base b
        LEFT JOIN LATERAL (
          SELECT *
          FROM active_promos ap
          WHERE ap.product_id = b.id
          ORDER BY ap.promo_price_cents ASC, ap.promotion_id DESC
          LIMIT 1
        ) ap ON TRUE
        ORDER BY 
          CASE b.category
            WHEN 'Entradas' THEN 1
            WHEN 'Pratos principais' THEN 2
            WHEN 'Sobremesas' THEN 3
            WHEN 'Bebidas' THEN 4
            ELSE 5
          END,
          COALESCE(b.sort_order, 999999),
          b.name
      `
    );
    return result.rows as unknown as MenuItem[];
  }
}

