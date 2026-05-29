import { BadRequestException, Injectable } from "@nestjs/common";
import { z } from "zod";
import { WorkflowDsl } from "../contracts/workflow-dsl.types";

const conditionTypes = ["has_issue_severity", "iteration_remaining", "critic_approved", "task_type_in"] as const;
export const workflowDslSchema = z.object({
  version: z.literal("1.0"),
  name: z.string().min(1),
  nodes: z.array(z.object({
    key: z.string().regex(/^[a-z0-9_]+$/),
    type: z.enum(["input", "requirement_lock", "ai_agent", "consensus", "critic", "resolver", "budget_gate", "human_approval", "final_output", "codex_prompt_generator", "export"]),
    title: z.string().min(1),
    agentRole: z.string().optional(),
    providerPreference: z.string().optional(),
    modelPreference: z.string().optional(),
    promptTemplateKey: z.string().optional(),
    budget: z.object({ maxTokens: z.number().positive().optional(), maxCostUsd: z.number().positive().optional() }).optional(),
    config: z.record(z.unknown()).optional()
  })).min(2),
  edges: z.array(z.object({
    key: z.string().min(1),
    from: z.string(),
    to: z.string(),
    condition: z.object({ type: z.enum(conditionTypes), severityIn: z.array(z.enum(["BLOCKER", "HIGH", "MEDIUM", "LOW"])).optional(), values: z.array(z.string()).optional() }).optional()
  })),
  stopConditions: z.object({ maxIterations: z.number().int().min(1).max(20), stopOnBudgetExceeded: z.boolean(), stopOnRequirementDrift: z.boolean(), stopOnUserStop: z.boolean() })
});

@Injectable()
export class WorkflowDslValidatorService {
  validate(input: unknown): WorkflowDsl {
    const result = workflowDslSchema.safeParse(input);
    if (!result.success) throw new BadRequestException({ code: "INVALID_WORKFLOW_DSL", details: result.error.flatten() });
    const dsl = result.data;
    const keys = new Set(dsl.nodes.map((node) => node.key));
    if (keys.size !== dsl.nodes.length) throw new BadRequestException("Node keys must be unique");
    for (const edge of dsl.edges) {
      if (!keys.has(edge.from) || !keys.has(edge.to)) throw new BadRequestException(`Edge ${edge.key} references unknown node`);
    }
    if (dsl.nodes.filter((node) => node.type === "requirement_lock").length !== 1) throw new BadRequestException("Workflow requires exactly one requirement_lock node");
    if (dsl.nodes.filter((node) => node.type === "final_output").length !== 1) throw new BadRequestException("Workflow requires exactly one final_output node");
    if (!dsl.nodes.some((node) => node.type === "critic")) throw new BadRequestException("Default workflow requires a critic node");
    const loopEdges = dsl.edges.filter((edge) => edge.to === dsl.nodes[1]?.key || edge.condition?.type === "iteration_remaining");
    if (loopEdges.length && !dsl.stopConditions.maxIterations) throw new BadRequestException("Loop edges require maxIterations");
    return dsl;
  }
}
