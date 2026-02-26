import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { initDatabase } from "./db/init-db";

async function bootstrap() {
  await initDatabase();

  const app = createApp();
  app.listen(env.port, () => {
    const port = env.port;
    console.log(`API rodando em http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar API:", error);
  process.exit(1);
});
