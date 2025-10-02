'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

import { KPICard } from '@/components/admin/kpi-card';
import { PaginatedTable } from '@/components/admin/paginated-table';
import CreateProjectModal from '@/components/dashboard/CreateProjectModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SafeImage } from '@/components/ui/safe-image';

// Project type definition (canonical schema)
type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget_total?: number;
  currency?: string;
  address?: string;
  scale?: {
    area_m2?: number;
    floors?: number;
    notes?: string;
  };
  investor_name?: string;
  investor_phone?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  org_id: string;
  // Legacy fields for backward compatibility
  budget?: string;
  startDate?: string;
  endDate?: string;
  thumbnailUrl?: string;
  // Manager info (if available)
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  managerAvatar?: string;
};

// Hook to fetch projects using React Query
function useProjects(page: number = 1) {
  const {
    data: projectsData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', page],
    queryFn: async () => {
      const url = `/api/v1/projects?page=${page}&limit=10`;

      const response = await fetch(url, {
        headers: {
          'x-e2e-bypass': 'true',
          'x-org-id': 'org_e2e_default',
          'x-user-id': 'test-user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      return data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  return {
    projects: projectsData?.items || [],
    total: projectsData?.total || 0,
    page: projectsData?.page || 1,
    totalPages: projectsData?.totalPages || 1,
    loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook to fetch project progress data
function useProjectsProgress() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects-progress'],
    queryFn: async () => {
      // TODO: Implement progress API endpoint when available
      // For now, return mock data or calculate from projects
      return null;
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    progressData: data,
    loading: isLoading,
    error: error?.message || null,
  };
}

// Hook to fetch transactions data for budget calculations
function useTransactions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/transactions', {
          headers: {
            'x-e2e-bypass': 'true',
            'x-org-id': 'org_e2e_default',
            'x-user-id': 'test-user',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data = await response.json();
        return data;
      } catch {
        // TODO: Implement transactions API endpoint when available
        return null;
      }
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    transactions: data?.items || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

const DashboardIndexPage = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { projects, total, page, totalPages, loading, error, refetch }
    = useProjects(currentPage);
  const { progressData, loading: progressLoading } = useProjectsProgress();
  const { transactions, loading: transactionsLoading } = useTransactions();

  // Translations
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  // Calculate KPI metrics
  const calculateAvgProgress = () => {
    // TODO: Calculate from progress API when available
    if (progressLoading || !progressData) {
      return '—';
    }
    // Fallback calculation or placeholder
    return '—';
  };

  const calculateBudgetUsed = () => {
    if (transactionsLoading || !transactions.length) {
      return { used: 0, total: 0, formatted: '—' };
    }

    const totalUsed = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const totalBudget = projects.reduce((sum: number, p: Project) => {
      return sum + (p.budget_total || Number(p.budget) || 0);
    }, 0);

    return {
      used: totalUsed,
      total: totalBudget,
      formatted:
        totalBudget > 0
          ? `${totalUsed.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' })} / ${totalBudget.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' })}`
          : '—',
    };
  };

  const calculateOverBudgetCount = () => {
    if (transactionsLoading || !transactions.length) {
      return 0;
    }

    // Group transactions by project and calculate over-budget projects
    const projectExpenses = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((acc: Record<string, number>, t: any) => {
        acc[t.project_id] = (acc[t.project_id] || 0) + (t.amount || 0);
        return acc;
      }, {});

    return projects.filter((p: Project) => {
      const budget = p.budget_total || Number(p.budget) || 0;
      const spent = projectExpenses[p.id] || 0;
      return budget > 0 && spent > budget;
    }).length;
  };

  const budgetMetrics = calculateBudgetUsed();
  const overBudgetCount = calculateOverBudgetCount();

  const projectColumns = [
    {
      key: 'thumbnail_url' as const,
      label: t('table.thumbnail'),
      render: (value: string, project: Project) => (
        <div className="h-12 w-16 overflow-hidden rounded-lg border">
          <SafeImage
            src={value || project.thumbnailUrl}
            alt="Project thumbnail"
            width={64}
            height={48}
            className="size-full"
          />
        </div>
      ),
    },
    {
      key: 'name' as const,
      label: t('table.projectName'),
      sortable: true,
    },
    {
      key: 'status' as const,
      label: t('table.status'),
      render: (value: string) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            value === 'completed'
              ? 'bg-green-100 text-green-800'
              : value === 'in_progress'
                ? 'bg-blue-100 text-blue-800'
                : value === 'on_hold'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value === 'planning'
            ? 'Planning'
            : value === 'in_progress'
              ? 'In Progress'
              : value === 'on_hold'
                ? 'On Hold'
                : value === 'completed'
                  ? 'Completed'
                  : value}
        </span>
      ),
    },
    {
      key: 'budget_total' as const,
      label: t('table.budget'),
      render: (value: number, project: Project) => {
        const budget = value || Number(project.budget) || 0;
        const currency = project.currency || 'VND';
        return (
          <span className="font-mono">
            {budget > 0
              ? new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency,
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(budget)
              : 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'investor_name' as const,
      label: t('table.investorName'),
      render: (value: string) => (
        <span className="text-sm">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'investor_phone' as const,
      label: t('table.investorPhone'),
      render: (value: string) => (
        <span className="font-mono text-sm">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'start_date' as const,
      label: t('table.startDate'),
      render: (value: string, project: Project) => {
        const date = value || project.startDate;
        return date ? new Date(date).toISOString().split('T')[0] : 'N/A';
      },
    },
    {
      key: 'end_date' as const,
      label: t('table.endDate'),
      render: (value: string, project: Project) => {
        const date = value || project.endDate;
        return date ? new Date(date).toISOString().split('T')[0] : 'N/A';
      },
    },
  ];

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle refresh (go back to first page)
  const handleRefresh = () => {
    setCurrentPage(1);
    refetch();
  };

  // Handle project creation refresh
  const handleProjectCreated = () => {
    handleRefresh();
  };

  // Handle create project
  const handleCreateProject = async (data: {
    name: string;
    status: string;
    description?: string;
    endDate?: string;
    thumbnailUrl?: string;
  }) => {
    try {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': 'true',
          'x-org-id': 'org_sample_123',
          'x-user-id': 'user_test_123',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create project');
      }

      await response.json();
      handleRefresh();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleEditProject = (_project: any) => {
    // Handle edit project
  };

  const handleDeleteProject = (_project: any) => {
    // Handle delete project
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('welcome')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            data-testid="create-project-button"
            role="button"
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t('totalProjects')}
          value={loading ? tCommon('loading') : total}
          description={t('activeProjects')}
          icon={Building2}
          trend={{ value: 12, label: 'from last month' }}
          className="rounded-2xl shadow-sm transition-shadow hover:shadow-md"
        />
        <KPICard
          title={t('avgProgress')}
          value={loading || progressLoading ? '...' : calculateAvgProgress()}
          description={t('avgProgressDescription')}
          icon={TrendingUp}
          trend={{ value: 5, label: 'from last week' }}
          className="rounded-2xl shadow-sm transition-shadow hover:shadow-md"
        />
        <KPICard
          title={t('budgetUsed')}
          value={
            loading || transactionsLoading ? '...' : budgetMetrics.formatted
          }
          description={t('budgetUsedDescription')}
          icon={DollarSign}
          trend={{
            value:
              budgetMetrics.total > 0
                ? Math.round((budgetMetrics.used / budgetMetrics.total) * 100)
                : 0,
            label: 'of total budget',
          }}
          className="rounded-2xl shadow-sm transition-shadow hover:shadow-md"
        />
        <KPICard
          title={t('overBudgetProjects')}
          value={loading || transactionsLoading ? '...' : overBudgetCount}
          description={t('overBudgetDescription')}
          icon={AlertTriangle}
          trend={{
            value: overBudgetCount > 0 ? -overBudgetCount : 0,
            label: 'projects over budget',
          }}
          className="rounded-2xl shadow-sm transition-shadow hover:shadow-md"
        />
      </div>

      {/* Recent Projects */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{t('recentProjects')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('projectsOverview')}
              </p>
            </div>
            <Button variant="outline" size="sm">
              {t('viewAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="mx-auto mb-2 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  {t('loadingProjects')}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="mb-2 text-sm text-destructive">
                  {t('errorLoadingProjects')}
                </p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Building2 className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('noProjectsFound')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('createFirstProject')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <PaginatedTable
                data={projects}
                columns={projectColumns}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                className="border-0"
                searchable
                searchPlaceholder={t('searchProjects')}
                pageSize={10}
                showPagination={false} // We handle pagination manually
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(1, page - 1))}
                          className={
                            page === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (page <= 3) {
                            pageNumber = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = page - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => handlePageChange(pageNumber)}
                                isActive={pageNumber === page}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        },
                      )}

                      {totalPages > 5 && page < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {totalPages > 5 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            isActive={page === totalPages}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(Math.min(totalPages, page + 1))}
                          className={
                            page === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Show current page info */}
              <div className="text-center text-sm text-muted-foreground">
                {t('showing')}
{' '}
{projects.length}
{' '}
{t('of')}
{' '}
{total}
{' '}
                {t('projects')}
{' '}
(
{t('page')}
{' '}
{page}
{' '}
{t('of')}
{' '}
{totalPages}
)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="size-5 text-primary" />
              <CardTitle className="text-lg">{t('quickActions')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="h-10 w-full justify-start">
              <Calendar className="mr-3 size-4" />
              {t('addDailyLog')}
            </Button>
            <Button variant="outline" className="h-10 w-full justify-start">
              <DollarSign className="mr-3 size-4" />
              {t('recordExpense')}
            </Button>
            <Button variant="outline" className="h-10 w-full justify-start">
              <Users className="mr-3 size-4" />
              {t('manageTeam')}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="size-5 text-primary" />
              <CardTitle className="text-lg">{t('recentActivity')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Calendar className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('activityTrackingComingSoon')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('realTimeActivityLogs')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="size-5 text-primary" />
              <CardTitle className="text-lg">{t('budgetOverview')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('totalBudget')}
                </span>
                <span className="font-semibold">
                  {loading
                    ? '...'
                    : projects
                        .reduce((total: number, project: Project) => {
                          const budget
                            = project.budget_total || Number(project.budget) || 0;
                          return total + budget;
                        }, 0)
                        .toLocaleString('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('projects')}
                </span>
                <span className="font-semibold">
                  {total}
{' '}
{t('projects')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('active')}
                </span>
                <span className="font-semibold text-green-600">
                  {
                    projects.filter((p: Project) => p.status === 'in_progress')
                      .length
                  }
{' '}
                  {t('active')}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${total > 0 ? (projects.filter((p: Project) => p.status === 'in_progress').length / total) * 100 : 0}%`,
                  }}
                >
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {total > 0
                  ? Math.round(
                      (projects.filter(
                        (p: Project) => p.status === 'in_progress',
                      ).length
                      / total)
                    * 100,
                    )
                  : 0}
                %
{t('projectsActive')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateProject}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default DashboardIndexPage;
