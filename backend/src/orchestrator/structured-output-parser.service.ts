import { Injectable } from "@nestjs/common";

@Injectable()
export class StructuredOutputParserService {
  parse<T = unknown>(raw: string): { ok: true; value: T } | { ok: false; raw: string; error: string } {
    const candidates = [raw, this.extractCodeBlock(raw), this.repair(raw)].filter(Boolean) as string[];
    for (const candidate of candidates) {
      try {
        return { ok: true, value: JSON.parse(candidate) as T };
      } catch {
        // try next candidate
      }
    }
    return { ok: false, raw, error: "structured_parse_failed" };
  }

  private extractCodeBlock(raw: string) {
    return /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)?.[1]?.trim();
  }

  private repair(raw: string) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return raw.slice(start, end + 1).replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    return "";
  }
}
