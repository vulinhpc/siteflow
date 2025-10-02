"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import CreateLogForm from "@/components/daily-logs/CreateLogForm";
import SubmittedList from "@/components/daily-logs/SubmittedList";
import QCRating from "@/components/daily-logs/QCRating";

// Mock user role - in real app this would come from auth context/Clerk
const getUserRole = () => {
  // For demo purposes, cycle through roles every 15 seconds
  const roles = ["ENGINEER", "PM", "ADMIN"];
  const roleIndex = Math.floor(Date.now() / 15000) % roles.length;
  return roles[roleIndex] || "ENGINEER";
};

// Mock all logs view for Admin/Owner
const AllLogsView = () => {
  const t = useTranslations("dailyLogs");
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground">DRAFT</h3>
          <p className="text-2xl font-bold">3</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground">SUBMITTED</h3>
          <p className="text-2xl font-bold">5</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground">APPROVED</h3>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground">DECLINED</h3>
          <p className="text-2xl font-bold">2</p>
        </div>
      </div>
      <div className="p-8 text-center border rounded-lg">
        <h3 className="text-lg font-medium mb-2">All Logs Overview</h3>
        <p className="text-muted-foreground">
          Detailed logs management interface for administrators
        </p>
      </div>
    </div>
  );
};

export default function DailyLogsPage() {
  const t = useTranslations("dailyLogs");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("create");
  
  const userRole = getUserRole();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Determine visible tabs based on role
  const getVisibleTabs = () => {
    switch (userRole) {
      case "ENGINEER":
        return ["create", "submitted"];
      case "PM":
        return ["submitted"];
      case "ADMIN":
      case "OWNER":
        return ["create", "submitted", "approved", "all"];
      default:
        return ["create"];
    }
  };

  const visibleTabs = getVisibleTabs();

  // Set default tab based on role
  const getDefaultTab = () => {
    if (userRole === "PM") return "submitted";
    if (userRole === "ADMIN" || userRole === "OWNER") return "submitted";
    return "create";
  };

  // Update active tab if current tab is not visible for role
  if (!visibleTabs.includes(activeTab)) {
    setActiveTab(getDefaultTab());
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
            aria-label={t("refresh")}
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {/* Role-based Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {visibleTabs.includes("create") && (
            <TabsTrigger value="create" className="gap-2">
              {t("tabs.create")}
            </TabsTrigger>
          )}
          {visibleTabs.includes("submitted") && (
            <TabsTrigger value="submitted" className="gap-2">
              {t("tabs.submitted")}
            </TabsTrigger>
          )}
          {visibleTabs.includes("approved") && (
            <TabsTrigger value="approved" className="gap-2">
              {t("tabs.approved")}
            </TabsTrigger>
          )}
          {visibleTabs.includes("all") && (
            <TabsTrigger value="all" className="gap-2">
              All Logs
            </TabsTrigger>
          )}
        </TabsList>

        {/* Engineer - Create Log Form */}
        {visibleTabs.includes("create") && (
          <TabsContent value="create" className="space-y-6">
            <CreateLogForm key={refreshKey} userRole={userRole} />
          </TabsContent>
        )}

        {/* PM - Submitted Logs for Review */}
        {visibleTabs.includes("submitted") && (
          <TabsContent value="submitted" className="space-y-6">
            <SubmittedList key={refreshKey} userRole={userRole} />
          </TabsContent>
        )}

        {/* QC - Approved Logs Rating */}
        {visibleTabs.includes("approved") && (
          <TabsContent value="approved" className="space-y-6">
            <QCRating key={refreshKey} userRole={userRole} />
          </TabsContent>
        )}

        {/* Admin - All Logs Overview */}
        {visibleTabs.includes("all") && (
          <TabsContent value="all" className="space-y-6">
            <AllLogsView />
          </TabsContent>
        )}
      </Tabs>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded">
          Role: {userRole} | Tab: {activeTab} | Visible: {visibleTabs.join(", ")}
        </div>
      )}
    </div>
  );
}