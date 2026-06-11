import { ForbiddenException } from "@nestjs/common";
import { AuthOriginGuard } from "../src/modules/auth/auth-origin.guard";

function makeGuard(nodeEnv: string, frontendOrigins: string[]) {
  return new AuthOriginGuard({
    get: (key: string) => ({
      nodeEnv,
      frontendOrigins
    })[key]
  } as any);
}

function context(origin?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { origin }
      })
    })
  } as any;
}

describe("AuthOriginGuard", () => {
  it("allows a missing Origin in development", () => {
    expect(makeGuard("development", []).canActivate(context())).toBe(true);
  });

  it("allows localhost in development", () => {
    expect(makeGuard("development", []).canActivate(context("http://localhost:3000"))).toBe(true);
  });

  it("allows an exact configured Origin in production", () => {
    expect(
      makeGuard("production", ["https://app.example.com"])
        .canActivate(context("https://app.example.com"))
    ).toBe(true);
  });

  it("rejects a missing Origin in production", () => {
    expect(() => makeGuard("production", []).canActivate(context()))
      .toThrow(ForbiddenException);
  });

  it("rejects an unconfigured Origin in production", () => {
    expect(() => makeGuard("production", ["https://app.example.com"])
      .canActivate(context("https://evil.example.com")))
      .toThrow(ForbiddenException);
  });
});
