import { BadRequestException } from "@nestjs/common";
import { WorkflowDslValidatorService } from "../src/orchestrator/workflow-dsl.validator";
import { defaultWorkflowDsl } from "../src/orchestrator/default-workflow.dsl";

describe("WorkflowDslValidatorService", () => {
  let validator: WorkflowDslValidatorService;
  beforeEach(() => { validator = new WorkflowDslValidatorService(); });

  it("validates the default DSL successfully", () => {
    expect(() => validator.validate(defaultWorkflowDsl)).not.toThrow();
  });

  it("returns the validated DSL object", () => {
    const result = validator.validate(defaultWorkflowDsl);
    expect(result.version).toBe("1.0");
    expect(result.nodes).toHaveLength(8);
  });

  it("rejects DSL missing requirement_lock", () => {
    const dsl = {
      ...defaultWorkflowDsl,
      nodes: defaultWorkflowDsl.nodes.filter((n) => n.type !== "requirement_lock")
    };
    expect(() => validator.validate(dsl)).toThrow(BadRequestException);
  });

  it("rejects DSL missing final_output", () => {
    const dsl = {
      ...defaultWorkflowDsl,
      nodes: defaultWorkflowDsl.nodes.filter((n) => n.type !== "final_output")
    };
    expect(() => validator.validate(dsl)).toThrow(BadRequestException);
  });

  it("rejects DSL with duplicate node keys", () => {
    const dsl = {
      ...defaultWorkflowDsl,
      nodes: [...defaultWorkflowDsl.nodes, { ...defaultWorkflowDsl.nodes[0] }]
    };
    expect(() => validator.validate(dsl)).toThrow(BadRequestException);
  });

  it("rejects DSL with edge referencing unknown node", () => {
    const dsl = {
      ...defaultWorkflowDsl,
      edges: [...defaultWorkflowDsl.edges, { key: "e_bad", from: "nonexistent_node", to: "final_output" }]
    };
    expect(() => validator.validate(dsl)).toThrow(BadRequestException);
  });

  it("rejects DSL with wrong version", () => {
    expect(() => validator.validate({ ...defaultWorkflowDsl, version: "2.0" as any })).toThrow();
  });

  it("rejects DSL with no critic node", () => {
    const dsl = {
      ...defaultWorkflowDsl,
      nodes: defaultWorkflowDsl.nodes.filter((n) => n.type !== "critic")
    };
    expect(() => validator.validate(dsl)).toThrow(BadRequestException);
  });
});
