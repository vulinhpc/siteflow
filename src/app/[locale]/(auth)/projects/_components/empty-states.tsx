"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Search, AlertTriangle } from "lucide-react";

interface EmptyStateProps {
  type: "no-projects" | "no-results" | "error";
  onCreateProject?: () => void;
  onRetry?: () => void;
}

export function EmptyState({ type, onCreateProject, onRetry }: EmptyStateProps) {
  const t = useTranslations("projects");
  
  if (type === "error") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("errors.loadFailed")}</h3>
          <p className="text-muted-foreground mb-4">
            Something went wrong while loading your projects.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              {t("errors.retry")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (type === "no-results") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects match your filters</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or clearing filters to see more results.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // no-projects (default)
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t("empty.title")}</h3>
        <p className="text-muted-foreground mb-6">
          {t("empty.description")}
        </p>
        {onCreateProject && (
          <Button onClick={onCreateProject}>
            {t("empty.action")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
