export interface ProjectFilters {
  q?: string;
  status?: string[];
  manager?: string;
  budgetMin?: number;
  budgetMax?: number;
  startFrom?: string;
  startTo?: string;
  sort?: string;
  limit?: number;
  cursor?: string;
}

export const DEFAULT_FILTERS: ProjectFilters = {
  q: "",
  status: [],
  manager: "",
  budgetMin: undefined,
  budgetMax: undefined,
  startFrom: "",
  startTo: "",
  sort: "updatedAt_desc",
  limit: 20,
  cursor: "",
};

export const SORT_OPTIONS = [
  { value: "updatedAt_desc", label: "Recently Updated" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "progress_desc", label: "Progress High-Low" },
  { value: "progress_asc", label: "Progress Low-High" },
  { value: "budget_used_pct_desc", label: "Budget Usage High-Low" },
  { value: "budget_used_pct_asc", label: "Budget Usage Low-High" },
] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function parseFiltersFromURL(searchParams: URLSearchParams): ProjectFilters {
  return {
    q: searchParams.get("q") || "",
    status: searchParams.get("status")?.split(",").filter(Boolean) || [],
    manager: searchParams.get("manager") || "",
    budgetMin: searchParams.get("budgetMin") ? Number(searchParams.get("budgetMin")) : undefined,
    budgetMax: searchParams.get("budgetMax") ? Number(searchParams.get("budgetMax")) : undefined,
    startFrom: searchParams.get("start_from") || "",
    startTo: searchParams.get("start_to") || "",
    sort: searchParams.get("sort") || DEFAULT_FILTERS.sort,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : DEFAULT_FILTERS.limit,
    cursor: searchParams.get("cursor") || "",
  };
}

export function filtersToURLParams(filters: ProjectFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.q) params.set("q", filters.q);
  if (filters.status?.length) params.set("status", filters.status.join(","));
  if (filters.manager) params.set("manager", filters.manager);
  if (filters.budgetMin !== undefined) params.set("budgetMin", filters.budgetMin.toString());
  if (filters.budgetMax !== undefined) params.set("budgetMax", filters.budgetMax.toString());
  if (filters.startFrom) params.set("start_from", filters.startFrom);
  if (filters.startTo) params.set("start_to", filters.startTo);
  if (filters.sort && filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.limit && filters.limit !== DEFAULT_FILTERS.limit) params.set("limit", filters.limit.toString());
  if (filters.cursor) params.set("cursor", filters.cursor);
  
  return params;
}

export function resetFilters(): ProjectFilters {
  return { ...DEFAULT_FILTERS };
}
