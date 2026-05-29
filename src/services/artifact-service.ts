import { artifacts } from "@/lib/mock-data";
import type { Artifact } from "@/lib/types";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

export const artifactService = {
  getArtifacts: async (projectId?: string): Promise<Artifact[]> => {
    await wait();
    return projectId ? artifacts.filter((artifact) => artifact.projectId === projectId) : artifacts;
  },

  getArtifactById: async (id: string): Promise<Artifact> => {
    await wait();
    return artifacts.find((artifact) => artifact.id === id) ?? artifacts[0];
  },

  exportArtifact: async (id: string, format: "markdown" | "json" = "markdown") => {
    await wait();
    const artifact = artifacts.find((item) => item.id === id) ?? artifacts[0];
    return {
      filename: `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format === "json" ? "json" : "md"}`,
      mimeType: format === "json" ? "application/json" : "text/markdown",
      content: format === "json" ? JSON.stringify(artifact, null, 2) : artifact.content
    };
  }
};
