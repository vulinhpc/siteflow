"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { parseFiltersFromURL, type ProjectFilters } from "./filters";

export interface Project {
  id: string;
  name: string;
  status: "planning" | "in_progress" | "on_hold" | "completed";
  thumbnail_url?: string;
  address?: string;
  progress_pct: number;
  budget_total: number;
  budget_used: number;
  budget_used_pct: number;
  dates: {
    start_date: string;
    end_date?: string;
  };
  manager: {
    name: string;
    avatar_url?: string;
    email?: string;
  };
  updatedAt: string;
}

export interface ProjectsResponse {
  items: Project[];
  nextCursor?: string;
  total?: number;
}

async function fetchProjects(filters: ProjectFilters): Promise<ProjectsResponse> {
  const params = new URLSearchParams();
  
  if (filters.q) params.set("q", filters.q);
  if (filters.status?.length) params.set("status", filters.status.join(","));
  if (filters.manager) params.set("manager", filters.manager);
  if (filters.budgetMin !== undefined) params.set("budget_min", filters.budgetMin.toString());
  if (filters.budgetMax !== undefined) params.set("budget_max", filters.budgetMax.toString());
  if (filters.startFrom) params.set("start_from", filters.startFrom);
  if (filters.startTo) params.set("start_to", filters.startTo);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.cursor) params.set("cursor", filters.cursor);

  const response = await fetch(`/api/v1/projects?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export function useProjectsQuery() {
  const searchParams = useSearchParams();
  const filters = parseFiltersFromURL(searchParams);
  
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: () => fetchProjects(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for KPI data (derived from projects)
export function useProjectsKPI() {
  const { data: projectsData, ...rest } = useProjectsQuery();
  
  const kpi = projectsData?.items ? {
    totalProjects: projectsData.items.length,
    activeProjects: projectsData.items.filter(p => 
      p.status === "in_progress" || p.status === "planning"
    ).length,
    avgProgress: Math.round(
      projectsData.items.reduce((sum, p) => sum + p.progress_pct, 0) / 
      projectsData.items.length
    ) || 0,
    totalBudget: projectsData.items.reduce((sum, p) => sum + p.budget_total, 0),
    overBudgetCount: projectsData.items.filter(p => p.budget_used > p.budget_total).length,
  } : {
    totalProjects: 0,
    activeProjects: 0,
    avgProgress: 0,
    totalBudget: 0,
    overBudgetCount: 0,
  };
  
  return {
    data: kpi,
    ...rest,
  };
}
