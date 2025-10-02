"use client";

import { useState } from "react";
import { ProjectsPageHeader } from "./_components/ProjectsPageHeader";
import { ProjectsToolbar } from "./_components/ProjectsToolbar";
import { ProjectsDataTable } from "./_components/ProjectsDataTable";
import CreateProjectModal from "@/components/dashboard/CreateProjectModal";

export default function ProjectsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header with KPI Cards */}
      <ProjectsPageHeader />
      
      {/* Toolbar with Search, Filters, and Actions */}
      <ProjectsToolbar onCreateProject={handleCreateProject} />
      
      {/* Data Table */}
      <ProjectsDataTable />
      
      {/* Create Project Modal */}
      <CreateProjectModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={async (data) => {
          // TODO: Implement actual project creation API call
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
