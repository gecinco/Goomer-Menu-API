import fp from "fastify-plugin";

export default fp(async (app) => {
  app.log.info("Logger plugin initialized");
});

