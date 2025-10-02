"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Upload, X, Save, Send, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-simple-toast";

// Zod schema for creating daily log (canonical)
const createLogSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  task_ids: z.array(z.string().uuid()).min(1, "At least one task is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  notes: z.string().min(10, "Notes must be at least 10 characters"),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(["image", "video"]),
    name: z.string(),
  })).min(1, "At least one media item is required"),
});

type CreateLogFormData = z.infer<typeof createLogSchema>;

interface CreateLogFormProps {
  userRole: string;
}

// Mock data - in real app this would come from API
const mockCategories = [
  { id: "cat-1", name: "Móng", project_id: "proj-1" },
  { id: "cat-2", name: "Cột dầm", project_id: "proj-1" },
  { id: "cat-3", name: "Tường xây", project_id: "proj-2" },
  { id: "cat-4", name: "Hoàn thiện", project_id: "proj-2" },
];

const mockTasks = [
  { id: "task-1", name: "Đào móng", category_id: "cat-1", status: "WAITING" },
  { id: "task-2", name: "Đổ bê tông móng", category_id: "cat-1", status: "IN_PROGRESS" },
  { id: "task-3", name: "Lắp cốt thép cột", category_id: "cat-2", status: "WAITING" },
  { id: "task-4", name: "Đổ bê tông cột", category_id: "cat-2", status: "WAITING" },
  { id: "task-5", name: "Xây tường gạch", category_id: "cat-3", status: "WAITING" },
  { id: "task-6", name: "Trát tường", category_id: "cat-4", status: "WAITING" },
];

export default function CreateLogForm({ userRole }: CreateLogFormProps) {
  const t = useTranslations("dailyLogs");
  const tCreate = useTranslations("dailyLogs.create");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<typeof mockTasks>([]);

  const form = useForm<CreateLogFormData>({
    resolver: zodResolver(createLogSchema),
    defaultValues: {
      date: new Date(),
      notes: "",
      media: [],
      task_ids: [],
    },
  });

  const { watch, setValue, trigger } = form;
  const selectedCategoryId = watch("category_id");
  const selectedTaskIds = watch("task_ids");
  const mediaItems = watch("media");

  // Check if user has permission
  if (userRole !== "ENGINEER" && userRole !== "ADMIN" && userRole !== "OWNER") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{tCreate("permissionDenied")}</h3>
          <p className="text-muted-foreground">{tCreate("engineerOnly")}</p>
        </CardContent>
      </Card>
    );
  }

  // Update available tasks when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const tasks = mockTasks.filter(task => task.category_id === selectedCategoryId);
      setAvailableTasks(tasks);
      // Clear selected tasks when category changes
      setValue("task_ids", []);
    } else {
      setAvailableTasks([]);
    }
  }, [selectedCategoryId, setValue]);

  const handleMediaUpload = () => {
    // Mock Cloudinary upload - in real app this would use actual Cloudinary widget
    const mockMedia = {
      url: `https://via.placeholder.com/400x300?text=Photo+${Date.now()}`,
      type: "image" as const,
      name: `photo_${Date.now()}.jpg`,
    };
    
    const currentMedia = form.getValues("media");
    setValue("media", [...currentMedia, mockMedia]);
    
    toast({
      title: tCreate("mediaUploaded"),
      description: tCreate("mediaUploadedDesc"),
    });
  };

  const removeMedia = (index: number) => {
    const currentMedia = form.getValues("media");
    setValue("media", currentMedia.filter((_, i) => i !== index));
  };

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    const currentTasks = form.getValues("task_ids");
    if (checked) {
      setValue("task_ids", [...currentTasks, taskId]);
    } else {
      setValue("task_ids", currentTasks.filter(id => id !== taskId));
    }
    // Trigger validation for task_ids field
    trigger("task_ids");
  };

  const onSaveDraft = async (data: CreateLogFormData) => {
    setIsSaving(true);
    try {
      // Mock API call - POST /api/v1/daily-logs with status=DRAFT
      console.log("Saving draft:", data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: tCreate("success"),
        description: tCreate("successDesc"),
      });
      
      // Reset form
      form.reset({
        date: new Date(),
        notes: "",
        media: [],
        task_ids: [],
      });
    } catch (error) {
      toast({
        title: tCreate("error"),
        description: "Failed to save draft",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitReview = async (data: CreateLogFormData) => {
    setIsSubmitting(true);
    try {
      // Mock API calls:
      // 1. POST /api/v1/daily-logs (status=DRAFT)
      // 2. PATCH /api/v1/daily-logs/:id { action: "submit" }
      console.log("Submitting for review:", data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: tCreate("submitted"),
        description: tCreate("submittedDesc"),
      });
      
      // Reset form
      form.reset({
        date: new Date(),
        notes: "",
        media: [],
        task_ids: [],
      });
    } catch (error) {
      toast({
        title: tCreate("error"),
        description: "Failed to submit for review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tCreate("title")}</CardTitle>
        <CardDescription>
          Fill in the details of today&apos;s construction progress and select relevant tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")} <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCategory")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tasks Multi-Selection */}
            <FormField
              control={form.control}
              name="task_ids"
              render={() => (
                <FormItem>
                  <FormLabel>{t("tasks")} <span className="text-destructive">*</span></FormLabel>
                  <div className="space-y-3">
                    {!selectedCategoryId ? (
                      <p className="text-sm text-muted-foreground">
                        {t("selectCategory")} first to see available tasks
                      </p>
                    ) : availableTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No tasks available for this category
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {availableTasks.map((task) => (
                          <div key={task.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={task.id}
                              checked={selectedTaskIds.includes(task.id)}
                              onCheckedChange={(checked) => 
                                handleTaskToggle(task.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={task.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                            >
                              {task.name}
                              <Badge 
                                variant={task.status === "IN_PROGRESS" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {task.status}
                              </Badge>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedTaskIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-sm text-muted-foreground">Selected:</span>
                        {selectedTaskIds.map((taskId) => {
                          const task = availableTasks.find(t => t.id === taskId);
                          return task ? (
                            <Badge key={taskId} variant="outline" className="text-xs">
                              {task.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Picker */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{tCreate("date")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{tCreate("selectDate")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCreate("notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tCreate("notesPlaceholder")}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Media Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>
                  {tCreate("media")} <span className="text-destructive">*</span>
                  <Badge variant="secondary" className="ml-2">{tCreate("mediaRequired")}</Badge>
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMediaUpload}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {tCreate("addMedia")}
                </Button>
              </div>

              {mediaItems.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">{tCreate("noMedia")}</p>
                  <p className="text-xs text-muted-foreground">{tCreate("mediaHint")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaItems.map((media, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {media.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit(onSaveDraft)}
                disabled={isSaving || isSubmitting}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? tCreate("saving") : tCreate("saveDraft")}
              </Button>
              
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmitReview)}
                disabled={isSaving || isSubmitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? tCreate("submitting") : tCreate("submitReview")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}