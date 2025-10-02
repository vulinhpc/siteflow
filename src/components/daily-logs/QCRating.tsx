"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, User, FileText, Image, AlertTriangle, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-simple-toast";

interface ApprovedLog {
  id: string;
  date: string;
  category_name: string;
  task_names: string[];
  reporter_name: string;
  notes: string;
  media_count: number;
  status: "APPROVED";
  approved_at: string;
  review_comment?: string;
  qc_rating?: number;
}

interface QCRatingProps {
  userRole: string;
}

// Mock data - in real app this would come from React Query
const mockApprovedLogs: ApprovedLog[] = [
  {
    id: "log-4",
    date: "2024-10-01",
    category_name: "Móng",
    task_names: ["Đào móng", "Đổ bê tông móng"],
    reporter_name: "Nguyễn Văn A",
    notes: "Hoàn thành đổ bê tông móng tầng hầm B1. Kiểm tra chất lượng bê tông đạt yêu cầu. Thời tiết thuận lợi cho việc thi công.",
    media_count: 3,
    status: "APPROVED",
    approved_at: "2024-10-01T15:30:00Z",
    review_comment: "Công việc thực hiện tốt, chất lượng đạt yêu cầu kỹ thuật.",
    qc_rating: undefined,
  },
  {
    id: "log-5",
    date: "2024-09-30",
    category_name: "Tường xây", 
    task_names: ["Xây tường gạch"],
    reporter_name: "Trần Thị B",
    notes: "Tiến hành xây tường tầng 1. Hoàn thành 60% khối lượng. Cần bổ sung vật liệu gạch cho ngày mai. Chất lượng mạch vữa đạt yêu cầu.",
    media_count: 2,
    status: "APPROVED",
    approved_at: "2024-09-30T16:45:00Z",
    review_comment: "Tiến độ tốt, cần chú ý chất lượng mạch vữa ở các góc tường.",
    qc_rating: 4,
  },
  {
    id: "log-6",
    date: "2024-09-29",
    category_name: "Hoàn thiện",
    task_names: ["Trát tường", "Lắp đặt hệ thống điện"], 
    reporter_name: "Lê Văn C",
    notes: "Lắp đặt hệ thống điện tầng 2. Kiểm tra an toàn điện. Phát hiện một số vấn đề cần khắc phục về tiếp địa và cách điện.",
    media_count: 4,
    status: "APPROVED",
    approved_at: "2024-09-29T17:15:00Z",
    review_comment: "Cần khắc phục các vấn đề an toàn trước khi tiếp tục công việc tiếp theo.",
    qc_rating: 3,
  },
];

// Star Rating Component
interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

function StarRating({ rating, onRatingChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              "transition-colors",
              !readonly && "hover:scale-110 transition-transform",
              readonly && "cursor-default"
            )}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onRatingChange?.(star)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function QCRating({ userRole }: QCRatingProps) {
  const t = useTranslations("dailyLogs.qc");
  const { toast } = useToast();
  const [logs, setLogs] = useState<ApprovedLog[]>(mockApprovedLogs);
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);

  // Check if user has permission - QC is typically done by ADMIN/OWNER
  if (userRole !== "ADMIN" && userRole !== "OWNER") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("permissionDenied")}</h3>
          <p className="text-muted-foreground">{t("adminOnly")}</p>
        </CardContent>
      </Card>
    );
  }

  const handleRating = async (logId: string, rating: number) => {
    setSubmittingRating(logId);
    try {
      // Mock API call - PATCH /api/v1/daily-logs/:id { action: "qc", qc_rating: rating }
      console.log(`Rating log ${logId} with ${rating} stars`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update log rating (optimistic update)
      setLogs(prev => 
        prev.map(log => 
          log.id === logId 
            ? { ...log, qc_rating: rating }
            : log
        )
      );
      
      toast({
        title: t("ratingSuccess"),
        description: t("ratingSuccessDesc"),
      });
    } catch (error) {
      toast({
        title: t("ratingError"),
        description: "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setSubmittingRating(null);
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
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          Rate the quality of approved construction work and provide QC feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {logs.map((log) => (
            <Card key={log.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(log.date), "MMMM dd, yyyy")}
                        </span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          APPROVED
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {log.reporter_name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FolderOpen className="h-4 w-4" />
                        {log.category_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Image className="h-4 w-4" />
                      {log.media_count} media
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tasks Completed</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {log.task_names.map((taskName, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {taskName}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Work Notes</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {log.notes}
                    </p>
                  </div>

                  {/* PM Review Comment */}
                  {log.review_comment && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t("reviewComment")}</span>
                      </div>
                      <div className="pl-6 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm italic">
                          &quot;{log.review_comment}&quot;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QC Rating */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t("rating")}</span>
                      <div className="text-xs text-muted-foreground">
                        {t("approvedAt")}: {format(new Date(log.approved_at), "MMM dd, HH:mm")}
                      </div>
                    </div>
                    
                    {log.qc_rating ? (
                      <div className="flex items-center gap-3">
                        <StarRating rating={log.qc_rating} readonly size="md" />
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800">
                          ⭐ {log.qc_rating}/5
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {t("rateQuality")}
                        </p>
                        <div className="flex items-center gap-3">
                          <StarRating
                            rating={0}
                            onRatingChange={(rating) => handleRating(log.id, rating)}
                            readonly={submittingRating === log.id}
                          />
                          {submittingRating === log.id && (
                            <span className="text-sm text-muted-foreground">
                              {t("submittingRating")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}