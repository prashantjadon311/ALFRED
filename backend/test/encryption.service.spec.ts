import { ConfigService } from "@nestjs/config";
import { EncryptionService } from "../src/security/encryption.service";
import { maskApiKey } from "../src/security/api-key-masker";

const makeService = () => {
  const config = { get: (key: string) => key === "ENCRYPTION_KEY" ? "test-key-32-bytes-for-unit-tests!" : undefined } as any as ConfigService;
  return new EncryptionService(config);
};

describe("EncryptionService", () => {
  it("encrypts and decrypts a string", () => {
    const svc = makeService();
    const original = "sk-my-secret-api-key-12345";
    const encrypted = svc.encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(svc.decrypt(encrypted)).toBe(original);
  });

  it("produces different ciphertext for the same plaintext (due to random IV)", () => {
    const svc = makeService();
    const text = "same-text";
    expect(svc.encrypt(text)).not.toBe(svc.encrypt(text));
  });

  it("encrypted output contains three dot-separated parts", () => {
    const svc = makeService();
    const parts = svc.encrypt("test").split(".");
    expect(parts).toHaveLength(3);
  });
});

describe("maskApiKey", () => {
  it("masks a long API key showing prefix and suffix", () => {
    const masked = maskApiKey("sk-123456789012345678901234567890abcd");
    expect(masked).toMatch(/^sk-123/);
    expect(masked).toMatch(/abcd$/);
    expect(masked).toContain("•");
  });

  it("masks short keys", () => {
    const masked = maskApiKey("abcdefgh");
    expect(masked).toContain("•");
  });

  it("returns empty string for empty input", () => {
    expect(maskApiKey("")).toBe("");
  });

  it("returns local-only unchanged", () => {
    expect(maskApiKey("local-only")).toBe("local-only");
  });
});
