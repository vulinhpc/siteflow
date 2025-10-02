'use client';

import React, { useState } from 'react';

import CreateProjectModal from './CreateProjectModal';

type ProjectModalProviderProps = {
  onProjectCreated?: () => void;
  children?: React.ReactNode;
};

export function ProjectModalProvider({
  onProjectCreated,
  children,
}: ProjectModalProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Listen for custom event to open modal
  React.useEffect(() => {
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('openCreateProjectModal', handleOpenModal);
    return () => {
      window.removeEventListener('openCreateProjectModal', handleOpenModal);
    };
  }, []);

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
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create project');
      }

      await response.json();
      // Project created successfully

      // Trigger refresh callback
      onProjectCreated?.();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  return (
    <>
      {children}
      <CreateProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateProject}
        onProjectCreated={onProjectCreated}
      />
    </>
  );
}
