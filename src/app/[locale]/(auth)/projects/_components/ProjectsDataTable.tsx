'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { createColumns } from './columns';
import { ProjectsMobileCard } from './ProjectsMobileCard';
import type { ProjectsFilters } from './useProjectsQuery';
import { useProjectsQuery } from './useProjectsQuery';

interface ProjectsDataTableProps {
  filters: ProjectsFilters;
}

export function ProjectsDataTable({ filters }: ProjectsDataTableProps) {
  const t = useTranslations('projects');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'project', desc: false },
  ]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjectsQuery(filters);

  const columns = createColumns();
  
  // Flatten all pages into a single array
  const allProjects = data?.pages?.flatMap((page: any) => page.items) || [];

  const table = useReactTable({
    data: allProjects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="text-destructive font-medium">{t('errors.loadFailed')}</div>
          <div className="text-sm text-muted-foreground">{error.message}</div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('errors.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Desktop skeleton */}
          <div className="hidden md:block">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`desktop-skeleton-${i}`} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[50px]" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobile skeleton */}
          <div className="md:hidden space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={`mobile-skeleton-${i}`} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-6 w-[60px]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (allProjects.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="text-lg font-medium">{t('empty.title')}</div>
          <div className="text-muted-foreground">{t('empty.description')}</div>
          <Button>{t('empty.action')}</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="projects-data-table">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center space-x-1 hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            <div className="flex flex-col">
                              <ChevronUp
                                className={`h-3 w-3 ${
                                  header.column.getIsSorted() === 'asc'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground/50'
                                }`}
                              />
                              <ChevronDown
                                className={`h-3 w-3 -mt-1 ${
                                  header.column.getIsSorted() === 'desc'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground/50'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50" data-testid="project-row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {allProjects.map((project: any) => (
          <ProjectsMobileCard key={project.id} project={project} />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="min-w-[120px]"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              t('pagination.loadMore')
            )}
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-muted-foreground">
        {t('pagination.showing', {
          start: 1,
          end: allProjects.length,
          total: allProjects.length,
        })}
      </div>
    </div>
  );
}