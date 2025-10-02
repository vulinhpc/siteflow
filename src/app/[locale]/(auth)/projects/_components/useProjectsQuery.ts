'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

export type ProjectsFilters = {
  q?: string;
  status?: string[];
  manager?: string;
  start_from?: string;
  start_to?: string;
  sort?: 'updatedAt' | 'name' | 'progress_pct' | 'budget_used_pct';
  order?: 'asc' | 'desc';
};

export type Project = {
  id: string;
  name: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  thumbnail_url?: string;
  address?: string;
  progress_pct: number;
  budget_total: number;
  budget_used: number;
  budget_used_pct: number;
  manager?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  } | null;
  dates: {
    start_date?: string;
    end_date?: string;
  };
  updatedAt: string;
  currency: string;
  description?: string;
  scale?: any;
  investor_name?: string;
  investor_phone?: string;
};

export type ProjectsResponse = {
  items: Project[];
  nextCursor?: string;
  total: number;
};

async function fetchProjects(
  filters: ProjectsFilters,
  cursor?: string,
  limit = 20,
): Promise<ProjectsResponse> {
  const params = new URLSearchParams();

  if (cursor) {
 params.set('cursor', cursor);
}
  params.set('limit', limit.toString());

  if (filters.q) {
 params.set('q', filters.q);
}
  if (filters.status && filters.status.length > 0) {
    filters.status.forEach(status => params.append('status', status));
  }
  if (filters.manager) {
 params.set('manager', filters.manager);
}
  if (filters.start_from) {
 params.set('start_from', filters.start_from);
}
  if (filters.start_to) {
 params.set('start_to', filters.start_to);
}
  if (filters.sort) {
 params.set('sort', filters.sort);
}
  if (filters.order) {
 params.set('order', filters.order);
}

  const response = await fetch(`/api/v1/projects?${params.toString()}`, {
    headers: {
      'x-e2e-bypass': 'true',
      'x-org-id': 'org_sample_123',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useProjectsQuery(filters: ProjectsFilters = {}, limit = 20) {
  // Create a stable key for React Query
  const queryKey = ['projects', {
    q: filters.q,
    status: filters.status?.sort(), // Sort array for stable key
    manager: filters.manager,
    start_from: filters.start_from,
    start_to: filters.start_to,
    sort: filters.sort,
    order: filters.order,
    limit,
  }];

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchProjects(filters, pageParam as string | undefined, limit),
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Hook for KPI calculations
export function useProjectsKPI() {
  const { data, isLoading, error } = useProjectsQuery({}, 100); // Get more items for KPI

  const allProjects = data?.pages?.flatMap((page: any) => page.items) || [];

  const kpi = {
    totalProjects: allProjects.length,
    avgProgress: allProjects.length > 0
      ? Math.round(allProjects.reduce((sum: number, p: Project) => sum + p.progress_pct, 0) / allProjects.length)
      : 0,
    budgetUsed: allProjects.reduce((sum: number, p: Project) => sum + p.budget_used, 0),
    budgetTotal: allProjects.reduce((sum: number, p: Project) => sum + p.budget_total, 0),
    overBudget: allProjects.filter((p: Project) => p.budget_used > p.budget_total).length,
  };

  return {
    kpi,
    isLoading,
    error,
  };
}
