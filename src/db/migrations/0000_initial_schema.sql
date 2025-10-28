CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"price_cents" integer NOT NULL,
	"category" varchar(64) NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotion_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"description" text NOT NULL,
	"promo_price_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotion_schedules" ADD CONSTRAINT "promotion_schedules_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotions" ADD CONSTRAINT "promotions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Additional constraints and indexes
DO $$ BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_products_category_visible_sort ON products (category, is_visible, COALESCE(sort_order, 999999), name)';
  EXCEPTION WHEN others THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions (product_id)';
  EXCEPTION WHEN others THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_promotion_schedules_promotion_day_time ON promotion_schedules (promotion_id, day_of_week, start_time)';
  EXCEPTION WHEN others THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE products
  ADD CONSTRAINT products_price_positive CHECK (price_cents > 0) NOT VALID;
--> statement-breakpoint
ALTER TABLE promotions
  ADD CONSTRAINT promotions_price_positive CHECK (promo_price_cents > 0) NOT VALID;
--> statement-breakpoint
ALTER TABLE promotion_schedules
  ADD CONSTRAINT schedules_day_valid CHECK (day_of_week BETWEEN 0 AND 6) NOT VALID;
--> statement-breakpoint
ALTER TABLE promotion_schedules
  ADD CONSTRAINT schedules_time_order CHECK (start_time < end_time) NOT VALID;
--> statement-breakpoint
ALTER TABLE products
  ADD CONSTRAINT products_category_check CHECK (category IN ('Entradas', 'Pratos principais', 'Sobremesas', 'Bebidas')) NOT VALID;
