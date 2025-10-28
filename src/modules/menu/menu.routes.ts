import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { MenuService } from "./menu.service";
import { ValidationError } from "../../shared/errors/api-error";

const routes: FastifyPluginAsync = async (app) => {
  const service = new MenuService(app.db);

  app.get("/", async (req, reply) => {
    const isValidIanaTz = (tz: string) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    };

    const schema = z.object({
      tz: z
        .string()
        .default(process.env.DEFAULT_TIMEZONE ?? "America/Sao_Paulo")
        .refine(isValidIanaTz, "Invalid IANA timezone"),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError("Invalid query parameters", parsed.error.flatten());
    }
    const { tz } = parsed.data as { tz: string };
    const menu = await service.getMenu(tz);
    return reply.send({ items: menu });
  });
};

export default routes;

