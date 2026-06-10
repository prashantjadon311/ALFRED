export const appConfig = () => {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const source = process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL;
  const frontendOrigins = source
    ? source.split(",").map((entry) => entry.trim()).filter(Boolean)
    : nodeEnv === "production"
      ? []
      : ["http://localhost:3000"];
  const frontendUrl = process.env.FRONTEND_URL ?? frontendOrigins[0] ?? "";
  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 4000),
    appUrl: process.env.APP_URL ?? "http://localhost:4000",
    frontendUrl,
    frontendOrigins,
    logLevel: process.env.LOG_LEVEL ?? "debug"
  };
};
