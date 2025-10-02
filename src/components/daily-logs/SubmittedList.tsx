"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Calendar, User, FileText, Image, AlertTriangle, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-simple-toast";
import ReviewDialog from "./ReviewDialog";

interface DailyLog {
  id: string;
  date: string;
  category_name: string;
  task_names: string[];
  reporter_name: string;
  notes: string;
  media_count: number;
  status: "SUBMITTED";
  submitted_at: string;
}

interface SubmittedListProps {
  userRole: string;
}

// Mock data - in real app this would come from React Query
const mockSubmittedLogs: DailyLog[] = [
  {
    id: "log-1",
    date: "2024-10-02",
    category_name: "Móng",
    task_names: ["Đào móng", "Đổ bê tông móng"],
    reporter_name: "Nguyễn Văn A",
    notes: "Hoàn thành đổ bê tông móng tầng hầm B1. Kiểm tra chất lượng bê tông đạt yêu cầu. Thời tiết thuận lợi cho việc thi công.",
    media_count: 3,
    status: "SUBMITTED",
    submitted_at: "2024-10-02T14:30:00Z",
  },
  {
    id: "log-2", 
    date: "2024-10-02",
    category_name: "Tường xây",
    task_names: ["Xây tường gạch"],
    reporter_name: "Trần Thị B",
    notes: "Tiến hành xây tường tầng 1. Hoàn thành 60% khối lượng. Cần bổ sung vật liệu gạch cho ngày mai. Chất lượng mạch vữa đạt yêu cầu.",
    media_count: 2,
    status: "SUBMITTED",
    submitted_at: "2024-10-02T16:15:00Z",
  },
  {
    id: "log-3",
    date: "2024-10-01", 
    category_name: "Hoàn thiện",
    task_names: ["Trát tường", "Lắp đặt hệ thống điện"],
    reporter_name: "Lê Văn C",
    notes: "Lắp đặt hệ thống điện tầng 2. Kiểm tra an toàn điện. Phát hiện một số vấn đề cần khắc phục về tiếp địa và cách điện.",
    media_count: 4,
    status: "SUBMITTED",
    submitted_at: "2024-10-01T17:45:00Z",
  },
];

export default function SubmittedList({ userRole }: SubmittedListProps) {
  const t = useTranslations("dailyLogs.submitted");
  const { toast } = useToast();
  const [logs, setLogs] = useState<DailyLog[]>(mockSubmittedLogs);
  const [reviewDialog, setReviewDialog] = useState<{
    isOpen: boolean;
    logId: string;
    action: "approve" | "decline";
  }>({
    isOpen: false,
    logId: "",
    action: "approve",
  });

  // Check if user has permission
  if (userRole !== "PM" && userRole !== "ADMIN" && userRole !== "OWNER") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("permissionDenied")}</h3>
          <p className="text-muted-foreground">{t("pmOnly")}</p>
        </CardContent>
      </Card>
    );
  }

  const handleApprove = (logId: string) => {
    setReviewDialog({
      isOpen: true,
      logId,
      action: "approve",
    });
  };

  const handleDecline = (logId: string) => {
    setReviewDialog({
      isOpen: true,
      logId,
      action: "decline",
    });
  };

  const handleReviewSubmit = async (logId: string, action: "approve" | "decline", comment?: string) => {
    try {
      // Mock API call - PATCH /api/v1/daily-logs/:id
      console.log(`${action} log ${logId}`, { comment });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove log from list (optimistic update)
      setLogs(prev => prev.filter(log => log.id !== logId));
      
      toast({
        title: action === "approve" ? t("approveSuccess") : t("declineSuccess"),
        description: action === "approve" ? t("approveSuccessDesc") : t("declineSuccessDesc"),
      });
      
      setReviewDialog({ isOpen: false, logId: "", action: "approve" });
    } catch (error) {
      toast({
        title: t("reviewError"),
        description: "Failed to process review",
        variant: "destructive",
      });
    }
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("noLogs")}</h3>
          <p className="text-muted-foreground">{t("noLogsHint")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            Review and approve daily logs submitted by engineers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead className="w-[120px]">Reporter</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[80px]">Media</TableHead>
                  <TableHead className="w-[120px]">Submitted</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.date), "MMM dd")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{log.category_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {log.task_names.slice(0, 2).map((taskName, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-1">
                            {taskName}
                          </Badge>
                        ))}
                        {log.task_names.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{log.task_names.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.reporter_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="text-sm line-clamp-2">{log.notes}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.media_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(log.submitted_at), "MMM dd, HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(log.id)}
                          className="gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {t("approve")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecline(log.id)}
                          className="gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          {t("decline")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <ReviewDialog
        isOpen={reviewDialog.isOpen}
        onClose={() => setReviewDialog({ isOpen: false, logId: "", action: "approve" })}
        onSubmit={handleReviewSubmit}
        logId={reviewDialog.logId}
        action={reviewDialog.action}
      />
    </>
  );
}