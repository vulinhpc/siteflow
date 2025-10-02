"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Share, 
  Archive,
  Building2,
  MapPin,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Project } from "./useProjectsQuery";

const formatCurrency = (amount: number, currency = "VND") => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadgeVariant = (status: Project["status"]) => {
  switch (status) {
    case "planning":
      return "secondary";
    case "in_progress":
      return "default";
    case "on_hold":
      return "destructive";
    case "completed":
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusColor = (status: Project["status"]) => {
  switch (status) {
    case "planning":
      return "text-blue-600 bg-blue-50";
    case "in_progress":
      return "text-green-600 bg-green-50";
    case "on_hold":
      return "text-red-600 bg-red-50";
    case "completed":
      return "text-gray-600 bg-gray-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export function useProjectColumns(): ColumnDef<Project>[] {
  const t = useTranslations("projects");
  
  return [
    // Thumbnail + Project Name
    {
      id: "project",
      header: t("columns.project"),
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              {project.thumbnail_url ? (
                <Image
                  src={project.thumbnail_url}
                  alt={project.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/projects/${project.id}/overview`}
                className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {project.name}
              </Link>
              {project.address && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">{project.address}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    
    // Manager
    {
      id: "manager",
      header: t("columns.manager"),
      cell: ({ row }) => {
        const manager = row.original.manager;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={manager.avatar_url} alt={manager.name} />
                    <AvatarFallback className="text-xs">
                      {manager.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium line-clamp-1">{manager.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{manager.email || manager.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    
    // Status
    {
      id: "status",
      header: t("columns.status"),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge 
            variant={getStatusBadgeVariant(status)}
            className={getStatusColor(status)}
          >
            {t(`status.${status}`)}
          </Badge>
        );
      },
    },
    
    // Progress
    {
      id: "progress",
      header: t("columns.progress"),
      cell: ({ row }) => {
        const progress = row.original.progress_pct;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground min-w-[35px]">
              {progress}%
            </span>
          </div>
        );
      },
    },
    
    // Budget
    {
      id: "budget",
      header: t("columns.budget"),
      cell: ({ row }) => {
        const project = row.original;
        const isOverBudget = project.budget_used > project.budget_total;
        
        return (
          <div className="text-sm">
            <div className={`font-medium ${isOverBudget ? "text-red-600" : "text-foreground"}`}>
              {formatCurrency(project.budget_used)} / {formatCurrency(project.budget_total)}
            </div>
            <div className={`text-xs ${isOverBudget ? "text-red-500" : "text-muted-foreground"}`}>
              {project.budget_used_pct}%
              {isOverBudget && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  Over Budget
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    
    // Timeline
    {
      id: "dates",
      header: t("columns.dates"),
      cell: ({ row }) => {
        const dates = row.original.dates;
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{format(new Date(dates.start_date), "dd MMM yyyy")}</span>
            {dates.end_date && (
              <>
                <ArrowRight className="h-3 w-3" />
                <span>{format(new Date(dates.end_date), "dd MMM yyyy")}</span>
              </>
            )}
          </div>
        );
      },
    },
    
    // Actions
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const project = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/overview`} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t("actions.view")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                {t("actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/${project.id}`);
                }}
              >
                <Share className="h-4 w-4" />
                {t("actions.share")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                <Archive className="h-4 w-4" />
                {t("actions.archive")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
