"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  X, 
  Plus,
  SlidersHorizontal
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { 
  parseFiltersFromURL, 
  filtersToURLParams, 
  resetFilters, 
  SORT_OPTIONS,
  type ProjectFilters 
} from "./filters";

// Mock managers data - in real app this would come from API
const MOCK_MANAGERS = [
  { id: "mgr-1", name: "Nguyễn Văn A" },
  { id: "mgr-2", name: "Trần Thị B" },
  { id: "mgr-3", name: "Lê Văn C" },
  { id: "mgr-4", name: "Phạm Thị D" },
];

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

interface ProjectsToolbarProps {
  onCreateProject?: () => void;
}

export function ProjectsToolbar({ onCreateProject }: ProjectsToolbarProps) {
  const t = useTranslations("projects");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<ProjectFilters>(() => 
    parseFiltersFromURL(searchParams)
  );
  const [searchValue, setSearchValue] = useState(filters.q || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const debouncedSearch = useDebounce(searchValue, 300);
  
  // Update URL when filters change
  const updateURL = useCallback((newFilters: ProjectFilters) => {
    const params = filtersToURLParams(newFilters);
    const url = `${window.location.pathname}?${params.toString()}`;
    router.push(url);
  }, [router]);
  
  // Update filters when search changes
  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      const newFilters = { ...filters, q: debouncedSearch, cursor: "" };
      setFilters(newFilters);
      updateURL(newFilters);
    }
  }, [debouncedSearch, filters, updateURL]);
  
  // Update filters when URL changes
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    setFilters(urlFilters);
    setSearchValue(urlFilters.q || "");
  }, [searchParams]);
  
  const handleFilterChange = (key: keyof ProjectFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, cursor: "" };
    setFilters(newFilters);
    updateURL(newFilters);
  };
  
  const handleStatusToggle = (status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    handleFilterChange("status", newStatus);
  };
  
  const handleResetFilters = () => {
    const newFilters = resetFilters();
    setFilters(newFilters);
    setSearchValue("");
    updateURL(newFilters);
    setIsFiltersOpen(false);
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.q) count++;
    if (filters.status?.length) count++;
    if (filters.manager) count++;
    if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) count++;
    if (filters.startFrom || filters.startTo) count++;
    return count;
  };
  
  const activeFiltersCount = getActiveFiltersCount();
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Left side - Search and Filters */}
      <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
            data-testid="projects-search"
          />
        </div>
        
        {/* Filters Sheet (Mobile) */}
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t("filters.apply")}
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Filter Projects</SheetTitle>
              <SheetDescription>
                Apply filters to find specific projects
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Status Filter */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("filters.status")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {STATUS_OPTIONS.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`status-${status.value}`}
                        checked={filters.status?.includes(status.value) || false}
                        onChange={() => handleStatusToggle(status.value)}
                        className="rounded border-gray-300"
                        data-testid="projects-filter-status"
                      />
                      <Label htmlFor={`status-${status.value}`} className="text-sm">
                        {t(`status.${status.value}`)}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Manager Filter */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("filters.manager")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={filters.manager || ""} 
                    onValueChange={(value) => handleFilterChange("manager", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Managers</SelectItem>
                      {MOCK_MANAGERS.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              
              {/* Budget Range Filter */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("filters.budget")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="budget-min" className="text-xs text-muted-foreground">
                      Minimum Budget
                    </Label>
                    <Input
                      id="budget-min"
                      type="number"
                      placeholder="0"
                      value={filters.budgetMin || ""}
                      onChange={(e) => handleFilterChange("budgetMin", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget-max" className="text-xs text-muted-foreground">
                      Maximum Budget
                    </Label>
                    <Input
                      id="budget-max"
                      type="number"
                      placeholder="No limit"
                      value={filters.budgetMax || ""}
                      onChange={(e) => handleFilterChange("budgetMax", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleResetFilters} variant="outline" className="flex-1">
                  {t("filters.reset")}
                </Button>
                <Button onClick={() => setIsFiltersOpen(false)} className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Sort */}
        <Select 
          value={filters.sort || "updatedAt_desc"} 
          onValueChange={(value) => handleFilterChange("sort", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            {filters.status?.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1">
                {t(`status.${status}`)}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleStatusToggle(status)}
                />
              </Badge>
            ))}
            {filters.manager && (
              <Badge variant="secondary" className="gap-1">
                Manager: {MOCK_MANAGERS.find(m => m.id === filters.manager)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange("manager", "")}
                />
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
        
        {/* Create Project Button */}
        {onCreateProject && (
          <Button onClick={onCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createProject")}
          </Button>
        )}
      </div>
    </div>
  );
}
