function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 3333,
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  geminiApiKey: getRequiredEnv("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
};
