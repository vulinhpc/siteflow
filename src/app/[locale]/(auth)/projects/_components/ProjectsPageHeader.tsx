"use client";

import { useTranslations } from "next-intl";
import { KPICards } from "./kpi-cards";

export function ProjectsPageHeader() {
  const t = useTranslations("projects");
  
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      
      {/* KPI Cards */}
      <KPICards />
    </div>
  );
}
