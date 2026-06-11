import { UnauthorizedException } from "@nestjs/common";
import { AuthCookieService } from "../src/modules/auth/auth-cookie.service";

function makeService(values: Record<string, unknown>) {
  return new AuthCookieService({ get: (key: string) => values[key] } as any);
}

describe("AuthCookieService", () => {
  it.each([
    ["15m", 900],
    ["7d", 604800]
  ])("sets an HttpOnly cookie with maxAge for %s", (refreshTtl, maxAge) => {
    const service = makeService({
      refreshCookieName: "session",
      refreshCookiePath: "/auth",
      refreshCookieDomain: "example.com",
      refreshCookieSecure: true,
      refreshCookieSameSite: "none",
      refreshTtl
    });
    const reply = { setCookie: jest.fn() };

    service.setRefreshCookie(reply as any, "secret");

    expect(reply.setCookie).toHaveBeenCalledWith("session", "secret", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/auth",
      domain: "example.com",
      maxAge
    });
  });

  it("clears with matching path, domain, secure, and SameSite options", () => {
    const service = makeService({
      refreshCookieName: "session",
      refreshCookiePath: "/auth",
      refreshCookieDomain: "example.com",
      refreshCookieSecure: true,
      refreshCookieSameSite: "strict"
    });
    const reply = { clearCookie: jest.fn() };

    service.clearRefreshCookie(reply as any);

    expect(reply.clearCookie).toHaveBeenCalledWith("session", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/auth",
      domain: "example.com"
    });
  });

  it("throws when the refresh cookie is missing", () => {
    const service = makeService({ refreshCookieName: "session" });
    expect(() => service.requireRefreshToken({ cookies: {} } as any)).toThrow(UnauthorizedException);
  });

  it("adds no-store headers to token responses", () => {
    const service = makeService({});
    const reply = { header: jest.fn() };

    service.applyNoStore(reply as any);

    expect(reply.header).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store"
    );

    expect(reply.header).toHaveBeenCalledWith(
      "Pragma",
      "no-cache"
    );
  });
});
