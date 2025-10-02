'use client';

import { Archive, Edit, Eye, MoreHorizontal, Share } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

import type { Project } from './useProjectsQuery';

type ProjectsMobileCardProps = {
  project: Project;
};

export function ProjectsMobileCard({ project }: ProjectsMobileCardProps) {
  const t = useTranslations('projects');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: project.currency || 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
 return '—';
}
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const getStatusVariant = (status: Project['status']) => {
    const variants = {
      planning: 'secondary',
      in_progress: 'default',
      on_hold: 'destructive',
      completed: 'success',
    } as const;
    return variants[status] as any;
  };

  const getStatusLabel = (status: Project['status']) => {
    const labels = {
      planning: t('planning'),
      in_progress: t('inProgress'),
      on_hold: t('onHold'),
      completed: t('completed'),
    };
    return labels[status];
  };

  const isOverBudget = project.budget_used > project.budget_total;

  return (
    <Card className="overflow-hidden" data-testid="project-card">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with thumbnail, title, and actions */}
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-start space-x-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {project.thumbnail_url
? (
                  <Image
                    src={project.thumbnail_url}
                    alt={project.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                )
: (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-medium">{project.name}</h3>
                {project.address && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {project.address}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 size-4" />
                  {t('actions.view')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 size-4" />
                  {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 size-4" />
                  {t('actions.share')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="mr-2 size-4" />
                  {t('actions.archive')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status and Manager Row */}
          <div className="flex items-center justify-between">
            <Badge variant={getStatusVariant(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>

            {project.manager
? (
              <div className="flex items-center space-x-2">
                <Avatar className="size-6">
                  <AvatarImage src={project.manager.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {project.manager.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {project.manager.name}
                </span>
              </div>
            )
: (
              <span className="text-xs text-muted-foreground">No manager</span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('columns.progress')}</span>
              <span className="text-sm font-medium">
{project.progress_pct}
%
              </span>
            </div>
            <Progress value={project.progress_pct} className="h-2" />
          </div>

          {/* Budget Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('columns.budget')}</span>
              <Badge
                variant={isOverBudget ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {isOverBudget ? t('budgetChip.overBudget') : t('budgetChip.onBudget')}
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used:</span>
                <span>{formatCurrency(project.budget_used)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span>{formatCurrency(project.budget_total)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Percentage:</span>
                <span>
{project.budget_used_pct.toFixed(1)}
%
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start:</span>
              <span>{formatDate(project.dates.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End:</span>
              <span>{formatDate(project.dates.end_date)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
