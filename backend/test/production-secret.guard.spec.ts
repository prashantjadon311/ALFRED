import { assertProductionSecrets } from "../src/config/production-secret.guard";

describe("assertProductionSecrets", () => {
  const validProductionEnv = {
    NODE_ENV: "production",
    JWT_ACCESS_SECRET: "access-secret-with-at-least-32-chars",
    JWT_REFRESH_SECRET: "refresh-secret-with-at-least-32-chars",
    ENCRYPTION_KEY: "encryption-key-with-at-least-32-chars",
    FRONTEND_URL: "https://alfred.example.com"
  };

  it("does not enforce production secrets outside production", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "test" })).not.toThrow();
  });

  it("accepts explicit production secrets", () => {
    expect(() => assertProductionSecrets(validProductionEnv)).not.toThrow();
  });

  it("accepts FRONTEND_URLS as the frontend configuration", () => {
    const { FRONTEND_URL: _frontendUrl, ...env } = validProductionEnv;
    expect(() => assertProductionSecrets({ ...env, FRONTEND_URLS: "https://one.example.com,https://two.example.com" })).not.toThrow();
  });

  it("rejects SameSite=None with explicitly insecure cookies", () => {
    expect(() => assertProductionSecrets({
      ...validProductionEnv,
      AUTH_REFRESH_COOKIE_SAME_SITE: "none",
      AUTH_REFRESH_COOKIE_SECURE: "false"
    })).toThrow(/AUTH_REFRESH_COOKIE_SECURE/);
  });

  it("accepts SameSite=None with secure cookies", () => {
    expect(() => assertProductionSecrets({
      ...validProductionEnv,
      AUTH_REFRESH_COOKIE_SAME_SITE: "none",
      AUTH_REFRESH_COOKIE_SECURE: "true"
    })).not.toThrow();
  });

  it("rejects missing, default, and short production values", () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: "production",
        JWT_ACCESS_SECRET: "change_me_access",
        JWT_REFRESH_SECRET: "short",
        ENCRYPTION_KEY: "change_this_32_byte_key_value"
      })
    ).toThrow(/JWT_ACCESS_SECRET.*JWT_REFRESH_SECRET.*ENCRYPTION_KEY.*FRONTEND_URL/);
  });
});
