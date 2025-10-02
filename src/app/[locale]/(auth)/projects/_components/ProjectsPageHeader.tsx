'use client';

import { useTranslations } from 'next-intl';

import { KpiCards } from './KpiCards';

export function ProjectsPageHeader() {
  const t = useTranslations('projects');

  return (
    <div className="space-y-6">
      {/* Page Title and Description */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      {/* KPI Cards */}
      <KpiCards />
    </div>
  );
}