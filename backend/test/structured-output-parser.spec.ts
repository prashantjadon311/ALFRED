import { StructuredOutputParserService } from "../src/orchestrator/structured-output-parser.service";

describe("StructuredOutputParserService", () => {
  let parser: StructuredOutputParserService;
  beforeEach(() => { parser = new StructuredOutputParserService(); });

  it("parses valid JSON directly", () => {
    const raw = JSON.stringify({ verdict: "approved", issues: [] });
    const result = parser.parse<any>(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verdict).toBe("approved");
    }
  });

  it("extracts JSON from markdown code block", () => {
    const raw = "Here is the output:\n```json\n{\"verdict\":\"needs_revision\",\"issues\":[{\"title\":\"Budget underspecified\",\"severity\":\"HIGH\"}]}\n```\nEnd of response.";
    const result = parser.parse<any>(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verdict).toBe("needs_revision");
    }
  });

  it("extracts JSON from plain code block", () => {
    const raw = "```\n{\"key\":\"value\"}\n```";
    const result = parser.parse<any>(raw);
    expect(result.ok).toBe(true);
  });

  it("repairs trailing comma in JSON", () => {
    const raw = `{"verdict": "approved", "issues": [],}`;
    const result = parser.parse<any>(raw);
    expect(result.ok).toBe(true);
  });

  it("returns error result for completely invalid input", () => {
    const raw = "This is not JSON at all and cannot be repaired #@!";
    const result = parser.parse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("structured_parse_failed");
      expect(result.raw).toBe(raw);
    }
  });

  it("extracts embedded JSON from prose", () => {
    const raw = `The critic output is as follows: {"verdict":"approved","summary":"Looks good."} End.`;
    const result = parser.parse<any>(raw);
    expect(result.ok).toBe(true);
  });
});
