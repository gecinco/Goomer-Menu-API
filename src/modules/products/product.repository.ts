import { sql } from "drizzle-orm";
import type { Database } from "../../shared/types/db.types";
import { NotFoundError, DatabaseError } from "../../shared/errors/api-error";
import type { ProductRow } from "../../shared/types/product.types";

export class ProductRepository {
  constructor(private readonly db: Database) {}

  async create(input: {
    name: string;
    priceCents: number;
    category: string;
    isVisible: boolean;
    sortOrder?: number | null;
  }): Promise<ProductRow> {
    const result = await this.db.execute(
      sql`
        INSERT INTO products (name, price_cents, category, is_visible, sort_order)
        VALUES (${input.name}, ${input.priceCents}, ${input.category}, ${input.isVisible}, ${
        input.sortOrder ?? null
      })
        RETURNING 
          id, 
          name, 
          price_cents AS "priceCents", 
          category, 
          is_visible AS "isVisible", 
          COALESCE(sort_order, NULL) AS "sortOrder",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `
    );
    return result.rows[0] as ProductRow;
  }

  async findById(id: number): Promise<ProductRow | null> {
    try {
      const result = await this.db.execute(
        sql`
          SELECT 
            id, 
            name, 
            price_cents AS "priceCents", 
            category, 
            is_visible AS "isVisible", 
            sort_order AS "sortOrder",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM products
          WHERE id = ${id}
        `
      );
      return result.rows[0] as ProductRow ?? null;
    } catch (error) {
      throw new DatabaseError(`Failed to find product: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async list(filters?: { onlyVisible?: boolean; category?: string }): Promise<ProductRow[]> {
    let whereClause = sql``;
    const conditions: any[] = [];

    if (filters?.onlyVisible) {
      conditions.push(sql`is_visible = TRUE`);
    }

    if (filters?.category) {
      conditions.push(sql`category = ${filters.category}`);
    }

    if (conditions.length > 0) {
      whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;
    }

    const result = await this.db.execute(
      sql`
        SELECT 
          id, 
          name, 
          price_cents AS "priceCents", 
          category, 
          is_visible AS "isVisible", 
          sort_order AS "sortOrder",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM products
        ${whereClause}
        ORDER BY category, COALESCE(sort_order, 999999), name
      `
    );
    return result.rows as ProductRow[];
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      priceCents: number;
      category: string;
      isVisible: boolean;
      sortOrder: number | null;
    }>
  ): Promise<ProductRow | null> {
    const sets: any[] = [];
    if (data.name !== undefined) sets.push(sql`name = ${data.name}`);
    if (data.priceCents !== undefined)
      sets.push(sql`price_cents = ${data.priceCents}`);
    if (data.category !== undefined)
      sets.push(sql`category = ${data.category}`);
    if (data.isVisible !== undefined)
      sets.push(sql`is_visible = ${data.isVisible}`);
    if (data.sortOrder !== undefined)
      sets.push(sql`sort_order = ${data.sortOrder}`);

    if (!sets.length) return null;

    const result = await this.db.execute(
      sql`
        UPDATE products
        SET ${sql.join([...sets, sql`updated_at = NOW()`], sql`, `)}
        WHERE id = ${id}
        RETURNING 
          id, 
          name, 
          price_cents AS "priceCents", 
          category, 
          is_visible AS "isVisible", 
          sort_order AS "sortOrder",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `
    );
    return result.rows[0] as ProductRow ?? null;
  }

  async delete(id: number) {
    await this.db.execute(sql`DELETE FROM products WHERE id = ${id}`);
  }
}

