import { api, isApiMode } from "@/lib/api-client";
import type { Artifact } from "@/lib/types";
import { demoWait } from "./mock-latency";

const wait = () => demoWait(120);
const loadMockArtifacts = async () => (await import("@/lib/mocks/project-detail")).artifacts;

function normalizeArtifact(artifact: any): Artifact {
  return {
    id: artifact.id,
    projectId: artifact.projectId,
    title: artifact.title,
    type: artifact.type === "json" ? "JSON" : artifact.type === "markdown" ? "Markdown" : "Spec",
    content: artifact.content ?? "",
    createdAt: artifact.createdAt
  };
}

export const artifactService = {
  getArtifacts: async (projectId?: string): Promise<Artifact[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/artifacts${projectId ? `?projectId=${projectId}` : ""}`)).map(normalizeArtifact);
    await wait();
    const artifacts = await loadMockArtifacts();
    return projectId ? artifacts.filter((artifact) => artifact.projectId === projectId) : artifacts;
  },

  getArtifactById: async (id: string): Promise<Artifact> => {
    if (isApiMode()) return normalizeArtifact(await api.get<any>(`/artifacts/${id}`));
    await wait();
    const artifacts = await loadMockArtifacts();
    return artifacts.find((artifact) => artifact.id === id) ?? artifacts[0];
  },

  exportArtifact: async (id: string, format: "markdown" | "json" = "markdown") => {
    if (isApiMode()) {
      const exported = await api.get<any>(`/artifacts/${id}/export?format=${format}`);
      const title = exported?.title ?? `artifact-${id}`;
      return {
        filename: `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format === "json" ? "json" : "md"}`,
        mimeType: format === "json" ? "application/json" : "text/markdown",
        content: format === "json" ? JSON.stringify(exported, null, 2) : String(exported?.content ?? "")
      };
    }
    await wait();
    const artifacts = await loadMockArtifacts();
    const artifact = artifacts.find((item) => item.id === id) ?? artifacts[0];
    return {
      filename: `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format === "json" ? "json" : "md"}`,
      mimeType: format === "json" ? "application/json" : "text/markdown",
      content: format === "json" ? JSON.stringify(artifact, null, 2) : artifact.content
    };
  },

  createArtifact: async (body: { title: string; type: string; content: string; projectId?: string }): Promise<Artifact> => {
    if (isApiMode()) return normalizeArtifact(await api.post<any>("/artifacts", body));
    await wait();
    return normalizeArtifact({ ...body, id: `artifact-${Date.now()}`, type: body.type, createdAt: new Date().toISOString() });
  }
};
