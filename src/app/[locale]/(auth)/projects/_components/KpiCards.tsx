'use client';

import { Building2, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useProjectsKPI } from './useProjectsQuery';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

function KpiCard({ title, value, icon, description, color = 'default' }: KpiCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    destructive: 'text-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={colorClasses[color]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[80px]" />
        <Skeleton className="h-3 w-[120px] mt-1" />
      </CardContent>
    </Card>
  );
}

export function KpiCards() {
  const t = useTranslations('projects.kpi');
  const { kpi, isLoading, error } = useProjectsKPI();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {['total', 'progress', 'budget', 'overbudget'].map((type) => (
          <KpiCardSkeleton key={`kpi-skeleton-${type}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {['total', 'progress', 'budget', 'overbudget'].map((type) => (
          <Card key={`kpi-error-${type}`}>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground text-sm">
                Failed to load
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const budgetUsedPercentage = kpi.budgetTotal > 0 
    ? ((kpi.budgetUsed / kpi.budgetTotal) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="kpi-cards">
      <KpiCard
        title={t('totalProjects')}
        value={kpi.totalProjects}
        icon={<Building2 className="h-4 w-4" />}
        description="Active construction projects"
      />
      
      <KpiCard
        title={t('avgProgress')}
        value={`${kpi.avgProgress}%`}
        icon={<TrendingUp className="h-4 w-4" />}
        description="Average completion rate"
        color={kpi.avgProgress >= 70 ? 'success' : kpi.avgProgress >= 40 ? 'warning' : 'destructive'}
      />
      
      <KpiCard
        title={t('budgetUsed')}
        value={formatCurrency(kpi.budgetUsed)}
        icon={<DollarSign className="h-4 w-4" />}
        description={`${budgetUsedPercentage}% of total budget`}
        color={Number(budgetUsedPercentage) > 100 ? 'destructive' : Number(budgetUsedPercentage) > 90 ? 'warning' : 'default'}
      />
      
      <KpiCard
        title={t('overBudget')}
        value={kpi.overBudget}
        icon={<AlertTriangle className="h-4 w-4" />}
        description="Projects exceeding budget"
        color={kpi.overBudget > 0 ? 'destructive' : 'success'}
      />
    </div>
  );
}
