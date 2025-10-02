'use client';

import { useState } from 'react';

import CreateProjectModal from '@/components/dashboard/CreateProjectModal';

import { ProjectsPageHeader } from './_components/ProjectsPageHeader';
import { ProjectsToolbar } from './_components/ProjectsToolbar';
import { ProjectsDataTable } from './_components/ProjectsDataTable';
import type { ProjectsFilters } from './_components/useProjectsQuery';

export default function ProjectsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<ProjectsFilters>({
    sort: 'updatedAt',
    order: 'desc',
  });

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = async (_data: any) => {
    // TODO: Implement actual project creation API call
    // For now, just close the modal and refresh the data
    setIsCreateModalOpen(false);
    
    // Trigger a refetch by updating filters slightly
    setFilters(prev => ({ ...prev }));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header with KPI Cards */}
      <ProjectsPageHeader />
      
      {/* Toolbar with Search, Filters, and Actions */}
      <ProjectsToolbar 
        filters={filters}
        onFiltersChange={setFilters}
        onCreateProject={handleCreateProject}
      />
      
      {/* Data Table */}
      <ProjectsDataTable filters={filters} />
      
      {/* Create Project Modal */}
      <CreateProjectModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleProjectCreated}
      />
    </div>
  );
}