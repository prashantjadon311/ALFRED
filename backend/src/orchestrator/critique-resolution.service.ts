import { Injectable } from "@nestjs/common";
@Injectable()
export class CritiqueResolutionService {
  hasBlockingIssues(issues: Array<{ severity: string }>) {
    return issues.some((issue) => issue.severity === "BLOCKER" || issue.severity === "HIGH");
  }
}
