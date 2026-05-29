import { BudgetService } from "../src/modules/budget/budget.service";

describe("BudgetService", () => {
  let service: BudgetService;
  beforeEach(() => { service = new BudgetService(); });

  describe("calculateCost", () => {
    it("calculates correct cost with default rates", () => {
      const cost = service.calculateCost(1000, 500);
      expect(cost).toBeCloseTo(0.005, 5);
    });

    it("returns zero cost for zero tokens", () => {
      expect(service.calculateCost(0, 0)).toBe(0);
    });

    it("uses custom rates", () => {
      const cost = service.calculateCost(1000, 0, 0.01, 0.03);
      expect(cost).toBeCloseTo(0.01, 5);
    });
  });

  describe("buildSnapshot", () => {
    it("returns normal mode at low usage with no warnings", () => {
      const snap = service.buildSnapshot(100000, 10000, 5, 0.5);
      expect(snap.mode).toBe("normal");
      expect(snap.warnings).toHaveLength(0);
    });

    it("returns compress mode at 80% usage", () => {
      const snap = service.buildSnapshot(100000, 82000, 5, 4.2);
      expect(snap.mode).toBe("compress");
    });

    it("returns pause mode at 95%+ usage", () => {
      const snap = service.buildSnapshot(100000, 96000, 5, 4.8);
      expect(snap.mode).toBe("pause");
    });

    it("returns stop mode at 100% usage", () => {
      const snap = service.buildSnapshot(100000, 100000, 5, 5);
      expect(snap.mode).toBe("stop");
    });

    it("includes multiple warnings at high usage", () => {
      const snap = service.buildSnapshot(100000, 82000, 5, 4.2);
      expect(snap.warnings.some((w) => w.includes("50%"))).toBe(true);
      expect(snap.warnings.some((w) => w.includes("80%"))).toBe(true);
    });

    it("calculates remaining tokens correctly", () => {
      const snap = service.buildSnapshot(100000, 30000, 5, 1.5);
      expect(snap.remainingTokens).toBe(70000);
    });
  });

  describe("assertCanSpend", () => {
    it("allows spending when budget is normal", () => {
      const snap = service.buildSnapshot(100000, 10000, 5, 0.5);
      const result = service.assertCanSpend(snap, 1000, 0.01);
      expect(result.allowed).toBe(true);
    });

    it("blocks spending when mode is stop", () => {
      const snap = service.buildSnapshot(100000, 100001, 5, 5.1);
      const result = service.assertCanSpend(snap, 1, 0.001);
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/budget/i);
    });

    it("blocks when estimated tokens exceed remaining", () => {
      const snap = service.buildSnapshot(100000, 99500, 5, 0.1);
      const result = service.assertCanSpend(snap, 1000, 0.001);
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/token/i);
    });

    it("blocks when estimated cost exceeds remaining", () => {
      const snap = service.buildSnapshot(100000, 0, 5, 4.999);
      const result = service.assertCanSpend(snap, 10, 0.01);
      expect(result.allowed).toBe(false);
    });
  });
});
