'use client';

import React, { useState } from 'react';
import { Search, Filter, X, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useDebounce } from '@/hooks/use-debounce';

import type { ProjectsFilters } from './useProjectsQuery';

interface ProjectsToolbarProps {
  filters: ProjectsFilters;
  onFiltersChange: (filters: ProjectsFilters) => void;
  onCreateProject: () => void;
}

export function ProjectsToolbar({
  filters,
  onFiltersChange,
  onCreateProject,
}: ProjectsToolbarProps) {
  const t = useTranslations('projects');
  const [searchValue, setSearchValue] = useState(filters.q || '');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(searchValue, 300);

  // Update filters when debounced search changes
  React.useEffect(() => {
    if (debouncedSearch !== filters.q) {
      onFiltersChange({ ...filters, q: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  const handleStatusChange = (status: string[]) => {
    onFiltersChange({ ...filters, status });
  };

  const handleSortChange = (sort: string) => {
    const [sortField, order] = sort.split('_');
    onFiltersChange({
      ...filters,
      sort: sortField as any,
      order: order as 'asc' | 'desc',
    });
  };

  const handleResetFilters = () => {
    setSearchValue('');
    onFiltersChange({});
    setIsFiltersOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.q) count++;
    if (filters.status?.length) count++;
    if (filters.manager) count++;
    if (filters.start_from || filters.start_to) count++;
    return count;
  };

  const getCurrentSort = () => {
    if (!filters.sort) return 'updatedAt_desc';
    return `${filters.sort}_${filters.order || 'desc'}`;
  };

  return (
    <div className="space-y-4">
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select value={getCurrentSort()} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt_desc">{t('sort.updatedDesc')}</SelectItem>
            <SelectItem value="updatedAt_asc">{t('sort.updatedAsc')}</SelectItem>
            <SelectItem value="name_asc">{t('sort.nameAsc')}</SelectItem>
            <SelectItem value="name_desc">{t('sort.nameDesc')}</SelectItem>
            <SelectItem value="progress_pct_desc">{t('sort.progressDesc')}</SelectItem>
            <SelectItem value="progress_pct_asc">{t('sort.progressAsc')}</SelectItem>
            <SelectItem value="budget_used_pct_desc">{t('sort.budgetDesc')}</SelectItem>
            <SelectItem value="budget_used_pct_asc">{t('sort.budgetAsc')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters Sheet */}
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              {t('filters.status')}
              {getActiveFiltersCount() > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('filters.status')}</SheetTitle>
              <SheetDescription>
                Filter projects by status, manager, budget, and dates
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label>{t('filters.status')}</Label>
                <div className="space-y-2">
                  {['planning', 'in_progress', 'on_hold', 'completed'].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={status}
                        checked={filters.status?.includes(status) || false}
                        onChange={(e) => {
                          const currentStatus = filters.status || [];
                          if (e.target.checked) {
                            handleStatusChange([...currentStatus, status]);
                          } else {
                            handleStatusChange(currentStatus.filter(s => s !== status));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={status} className="text-sm">
                        {t(`status.${status}`)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Filter */}
              <div className="space-y-2">
                <Label>{t('filters.manager')}</Label>
                <Select
                  value={filters.manager || ''}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, manager: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All managers</SelectItem>
                    {/* TODO: Load actual managers from API */}
                    <SelectItem value="manager1">John Doe</SelectItem>
                    <SelectItem value="manager2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>{t('filters.dateRange')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="start_from" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="start_from"
                      type="date"
                      value={filters.start_from || ''}
                      onChange={(e) =>
                        onFiltersChange({ ...filters, start_from: e.target.value || undefined })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_to" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="start_to"
                      type="date"
                      value={filters.start_to || ''}
                      onChange={(e) =>
                        onFiltersChange({ ...filters, start_to: e.target.value || undefined })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                {t('filters.reset')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Create Project Button */}
        <Button onClick={onCreateProject}>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.create')}
        </Button>
      </div>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.q && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.q}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ ...filters, q: undefined });
                }}
              />
            </Badge>
          )}
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {t(`status.${status.replace('_', '')}`)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  handleStatusChange(filters.status?.filter(s => s !== status) || []);
                }}
              />
            </Badge>
          ))}
          {filters.manager && (
            <Badge variant="secondary" className="gap-1">
              Manager: {filters.manager}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, manager: undefined })}
              />
            </Badge>
          )}
          {(filters.start_from || filters.start_to) && (
            <Badge variant="secondary" className="gap-1">
              Date: {filters.start_from || '...'} - {filters.start_to || '...'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  start_from: undefined, 
                  start_to: undefined 
                })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}