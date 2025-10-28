import "dotenv/config";
import Fastify from "fastify";
import dbPlugin from "./plugins/db";
import loggerPlugin from "./plugins/logger";
import productRoutes from "../modules/products/product.routes";
import promotionRoutes from "../modules/promotions/promotion.routes";
import menuRoutes from "../modules/menu/menu.routes";
import { errorHandler } from "../shared/middleware/error-handler";

const app = Fastify({ logger: true });

app.register(loggerPlugin);
app.register(dbPlugin);

// Global error handler
app.setErrorHandler(errorHandler);

app.register(productRoutes, { prefix: "/products" });
app.register(promotionRoutes, { prefix: "/promotions" });
app.register(menuRoutes, { prefix: "/menu" });

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

const close = async () => {
  try {
    await app.close();
    process.exit(0);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
};

process.on("SIGTERM", close);
process.on("SIGINT", close);

