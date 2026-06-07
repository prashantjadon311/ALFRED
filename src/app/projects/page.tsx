"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Grid2X2, List, Plus, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectDateFilters, defaultProjectDateFilters, type ProjectDateFilterState } from "@/components/projects/ProjectDateFilters";
import { ProjectTable } from "@/components/projects/ProjectTable";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import { SearchInput } from "@/components/shared/SearchInput";
import type { Project, ProjectStatus } from "@/lib/types";
import { useProjectStore } from "@/store/project-store";

const filters: Array<ProjectStatus | "All"> = ["All", "Active", "Planning", "Waiting Approval", "Paused", "Completed", "Failed"];
const PROJECT_LIST_PAGE_SIZE = 20;
const ProjectTaskDashboard = dynamic(
  () => import("@/components/projects/ProjectTaskDashboard").then((mod) => mod.ProjectTaskDashboard),
  { ssr: false }
);

function atStartOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function atEndOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function dateInputToDate(value: string, end = false) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return end ? atEndOfDay(date) : atStartOfDay(date);
}

function inRange(value: string, from: Date | null, to: Date | null) {
  const date = new Date(value);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function presetRange(preset: ProjectDateFilterState["preset"]) {
  const today = atStartOfDay(new Date());
  const end = atEndOfDay(today);
  if (preset === "Today") return { from: today, to: end };
  if (preset === "Yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return { from: atStartOfDay(yesterday), to: atEndOfDay(yesterday) };
  }
  if (preset === "Last 7 days") {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { from, to: end };
  }
  if (preset === "Last 30 days") {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return { from, to: end };
  }
  return null;
}

function matchesDateFilters(project: Project, dateFilters: ProjectDateFilterState) {
  if (dateFilters.preset !== "Custom") {
    const range = presetRange(dateFilters.preset);
    if (!range) return true;
    return inRange(project.createdAt, range.from, range.to) || inRange(project.updatedAt, range.from, range.to);
  }

  const createdFrom = dateInputToDate(dateFilters.createdFrom);
  const createdTo = dateInputToDate(dateFilters.createdTo, true);
  const updatedFrom = dateInputToDate(dateFilters.updatedFrom);
  const updatedTo = dateInputToDate(dateFilters.updatedTo, true);
  return inRange(project.createdAt, createdFrom, createdTo) && inRange(project.updatedAt, updatedFrom, updatedTo);
}

export default function ProjectsPage() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filter, setFilter] = useState<ProjectStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState("Software");
  const [dateFilters, setDateFilters] = useState<ProjectDateFilterState>(defaultProjectDateFilters);
  const [visibleLimit, setVisibleLimit] = useState(PROJECT_LIST_PAGE_SIZE);
  const allProjects = useProjectStore((state) => state.projects);
  const createProject = useProjectStore((state) => state.createProject);
  const loadProjects = useProjectStore((state) => state.loadFromApi);
  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);
  const projects = useMemo(
    () =>
      allProjects.filter((project) => {
        const matchesStatus = filter === "All" || project.status === filter;
        const matchesSearch = !normalizedSearch || `${project.name} ${project.description}`.toLowerCase().includes(normalizedSearch);
        return matchesStatus && matchesSearch && matchesDateFilters(project, dateFilters);
      }),
    [allProjects, dateFilters, filter, normalizedSearch]
  );
  const visibleProjects = useMemo(() => projects.slice(0, visibleLimit), [projects, visibleLimit]);
  const hasMoreProjects = visibleProjects.length < projects.length;

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    setVisibleLimit(PROJECT_LIST_PAGE_SIZE);
  }, [dateFilters, filter, normalizedSearch]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const submitProject = async () => {
    if (!projectName.trim()) return;
    await createProject({ name: projectName, description: projectDescription, type: projectType });
    setProjectName("");
    setProjectDescription("");
    setProjectType("Software");
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-3 py-1.5 text-sm transition hover:-translate-y-px hover:border-primary/40 hover:bg-primary/10 ${filter === item ? "border-primary bg-primary text-white shadow-glow" : "border-surface-darkBorder bg-surface-darkElevated/60 text-slate-300 hover:text-white"}`}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput className="w-full sm:w-80" value={search} onChange={setSearch} placeholder="Search projects" />
            <div className="flex gap-2">
              <Button variant={view === "grid" ? "primary" : "secondary"} size="icon" aria-label="Grid view" onClick={() => setView("grid")}>
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button variant={view === "table" ? "primary" : "secondary"} size="icon" aria-label="Table view" onClick={() => setView("table")}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
                Create
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <ProjectDateFilters value={dateFilters} onChange={setDateFilters} />
        </div>
      </GlassCard>

      <ProjectTaskDashboard />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {hasMoreProjects ? `${visibleProjects.length} of ${projects.length}` : projects.length} projects shown
          </p>
        </div>
        {view === "grid" ? (
          projects.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyState title="No projects found" description="Adjust the filters or create a mocked project to continue." />
          )
        ) : projects.length ? (
          <ProjectTable projects={visibleProjects} />
        ) : (
          <EmptyState title="No projects found" description="Adjust the filters or create a mocked project to continue." />
        )}
        {hasMoreProjects ? (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => setVisibleLimit((limit) => limit + PROJECT_LIST_PAGE_SIZE)}>
              Load more
            </Button>
          </div>
        ) : null}
      </section>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setModalOpen(false)}>
            <motion.div className="glass-panel relative z-[100] w-full max-w-xl rounded-panel p-6" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }} onMouseDown={(event) => event.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Create Project</h2>
                <Button size="icon" variant="ghost" aria-label="Close create project modal" onClick={() => setModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" placeholder="Project name" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
                <textarea className="min-h-28 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated p-3 text-sm text-white" placeholder="Original requirement" value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} />
                <select className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={projectType} onChange={(event) => setProjectType(event.target.value)}>
                  <option>Software</option>
                  <option>Research</option>
                  <option>Planning</option>
                  <option>Mixed</option>
                </select>
                <Button className="w-full" variant="primary" onClick={submitProject} disabled={!projectName.trim()}>
                  Create mocked project
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
