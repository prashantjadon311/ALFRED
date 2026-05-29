export const authConfig = () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? "change_me_access",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "change_me_refresh",
  accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d"
});
