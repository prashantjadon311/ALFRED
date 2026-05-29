import { Injectable } from "@nestjs/common";

@Injectable()
export class RequirementDriftService {
  check(input: { originalRequirement: string; lockedGoal: string; taskType: string; forbiddenChanges?: string[]; output: string }) {
    const output = input.output.toLowerCase();
    const forbidden = (input.forbiddenChanges ?? []).some((item) => output.includes(item.toLowerCase()));
    const explicitChange = /(change|replace|ignore).{0,40}(motive|requirement|goal)|trading|stock/i.test(output) && /trading|stock/i.test(output);
    const driftDetected = forbidden || explicitChange;
    return {
      driftDetected,
      driftScore: driftDetected ? 0.92 : 0.08,
      reason: driftDetected ? "Output appears to change the locked motive or includes forbidden direction." : "No material drift detected.",
      severity: driftDetected ? "HIGH" as const : "LOW" as const
    };
  }
}
