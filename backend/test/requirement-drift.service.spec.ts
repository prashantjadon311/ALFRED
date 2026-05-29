import { RequirementDriftService } from "../src/orchestrator/requirement-drift.service";

const baseInput = {
  originalRequirement: "Build A.L.F.R.E.D. agentic AI orchestration platform",
  lockedGoal: "Production-quality MVP backend for the A.L.F.R.E.D. platform",
  taskType: "software",
  forbiddenChanges: ["Changing original motive", "Switching product category", "Exposing secrets"],
  output: ""
};

describe("RequirementDriftService", () => {
  let service: RequirementDriftService;
  beforeEach(() => { service = new RequirementDriftService(); });

  it("detects no drift for compliant output", () => {
    const result = service.check({ ...baseInput, output: "We will build the agentic workflow orchestration backend using NestJS and BullMQ." });
    expect(result.driftDetected).toBe(false);
    expect(result.severity).toBe("LOW");
  });

  it("detects drift when output mentions trading stocks", () => {
    const result = service.check({ ...baseInput, output: "Change this to a trading platform for stock market analysis." });
    expect(result.driftDetected).toBe(true);
    expect(result.severity).toBe("HIGH");
    expect(result.driftScore).toBeGreaterThan(0.5);
  });

  it("returns a reason string when drift is detected", () => {
    const result = service.check({ ...baseInput, output: "Ignore original motive and switch to stock trading." });
    expect(result.driftDetected).toBe(true);
    expect(result.reason).toBeTruthy();
    expect(result.reason.length).toBeGreaterThan(10);
  });

  it("returns a low drift score for compliant output", () => {
    const result = service.check({ ...baseInput, output: "Building the AI orchestration backend with NestJS." });
    expect(result.driftScore).toBeLessThan(0.5);
  });
});
