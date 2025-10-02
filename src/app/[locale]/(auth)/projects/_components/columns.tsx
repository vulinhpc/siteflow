'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, Share, Archive } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { Project } from './useProjectsQuery';

// Status badge component
function StatusBadge({ status }: { status: Project['status'] }) {
  const t = useTranslations('projects.status');
  
  const variants = {
    planning: 'secondary',
    in_progress: 'default',
    on_hold: 'destructive',
    completed: 'success',
  } as const;

  const labels = {
    planning: t('planning'),
    in_progress: t('in_progress'),
    on_hold: t('on_hold'),
    completed: t('completed'),
  };

  return (
    <Badge variant={variants[status] as any}>
      {labels[status]}
    </Badge>
  );
}

// Budget chip component
function BudgetChip({ project }: { project: Project }) {
  const t = useTranslations('projects.budgetChip');
  
  const isOverBudget = project.budget_used > project.budget_total;
  const isOnBudget = project.budget_used_pct >= 90 && project.budget_used_pct <= 100;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: project.currency || 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {formatCurrency(project.budget_used)}
            </div>
            <div className="text-xs text-muted-foreground">
              / {formatCurrency(project.budget_total)}
            </div>
            <Badge 
              variant={isOverBudget ? 'destructive' : isOnBudget ? 'default' : 'secondary'}
              className="text-xs"
            >
              {isOverBudget 
                ? t('overBudget') 
                : isOnBudget 
                ? t('onBudget') 
                : t('underBudget')
              }
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{project.budget_used_pct.toFixed(1)}% used</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Actions dropdown component
function ActionsDropdown({ project: _ }: { project: Project }) {
  const t = useTranslations('projects.actions');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          {t('view')}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          {t('share')}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Archive className="mr-2 h-4 w-4" />
          {t('archive')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createColumns(): ColumnDef<Project>[] {
  return [
    {
      id: 'thumbnail',
      header: 'Image',
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="w-12 h-12 relative rounded-md overflow-hidden bg-muted">
            {project.thumbnail_url ? (
              <Image
                src={project.thumbnail_url}
                alt={project.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No Image
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 60,
    },
    {
      id: 'project',
      header: 'Project',
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium" data-testid="project-name">{project.name}</div>
            {project.address && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {project.address}
              </div>
            )}
          </div>
        );
      },
      enableSorting: true,
      sortingFn: 'alphanumeric',
    },
    {
      id: 'manager',
      header: 'Manager',
      cell: ({ row }) => {
        const project = row.original;
        if (!project.manager) {
          return <span className="text-muted-foreground text-sm">No manager</span>;
        }
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.manager.avatar_url} />
                    <AvatarFallback>
                      {project.manager.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{project.manager.name}</div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <p className="font-medium">{project.manager.name}</p>
                  {project.manager.email && (
                    <p className="text-sm text-muted-foreground">{project.manager.email}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const project = row.original;
        return <StatusBadge status={project.status} />;
      },
      enableSorting: true,
      sortingFn: 'alphanumeric',
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="space-y-2 min-w-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{project.progress_pct}%</span>
            </div>
            <Progress value={project.progress_pct} className="h-2" />
          </div>
        );
      },
      enableSorting: true,
      sortingFn: 'alphanumeric',
    },
    {
      id: 'budget',
      header: 'Budget',
      cell: ({ row }) => {
        const project = row.original;
        return <BudgetChip project={project} />;
      },
      enableSorting: true,
      sortingFn: 'alphanumeric',
    },
    {
      id: 'dates',
      header: 'Timeline',
      cell: ({ row }) => {
        const project = row.original;
        const formatDate = (dateStr?: string) => {
          if (!dateStr) return '—';
          return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(new Date(dateStr));
        };

        return (
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Start:</span>{' '}
              {formatDate(project.dates.start_date)}
            </div>
            <div>
              <span className="text-muted-foreground">End:</span>{' '}
              {formatDate(project.dates.end_date)}
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const project = row.original;
        return <ActionsDropdown project={project} />;
      },
      enableSorting: false,
      size: 50,
    },
  ];
}