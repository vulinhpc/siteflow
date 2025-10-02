"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (logId: string, action: "approve" | "decline", comment?: string) => Promise<void>;
  logId: string;
  action: "approve" | "decline";
}

export default function ReviewDialog({
  isOpen,
  onClose,
  onSubmit,
  logId,
  action,
}: ReviewDialogProps) {
  const t = useTranslations("dailyLogs.review");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate required comment for decline
    if (action === "decline" && !comment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(logId, action, comment.trim() || undefined);
      setComment("");
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setComment("");
      onClose();
    }
  };

  const isDecline = action === "decline";
  const commentRequired = isDecline;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDecline ? (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                {t("declineTitle")}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                {t("approveTitle")}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isDecline ? t("declineDesc") : t("approveDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">
              {commentRequired ? t("commentRequired") : t("commentOptional")}
            </Label>
            <Textarea
              id="comment"
              placeholder={
                isDecline ? t("declinePlaceholder") : t("approvePlaceholder")
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            {commentRequired && (
              <p className="text-sm text-muted-foreground">
                {t("commentHint")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (commentRequired && !comment.trim())}
            variant={isDecline ? "destructive" : "default"}
            className="gap-2"
          >
            {isDecline ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isSubmitting
              ? t("submitting")
              : isDecline
              ? t("declineButton")
              : t("approveButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}