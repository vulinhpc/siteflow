"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-simple";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

// Zod schema matching API requirements
const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Project name must be at most 255 characters"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "DONE", "ON_HOLD", "CANCELLED"], {
    required_error: "Project status is required",
  }),
  description: z.string().optional(),
  endDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) {
        return true;
      }
      const date = new Date(val);
      return !Number.isNaN(date.getTime());
    }, "Invalid date format"),
  thumbnailUrl: z
    .string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal("")),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

type CreateProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProjectFormData) => Promise<void>;
  onProjectCreated?: () => void;
};

export function CreateProjectModal({
  open,
  onOpenChange,
  onSubmit,
  onProjectCreated,
}: CreateProjectModalProps) {
  const { addToast } = useToast();

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      status: "PLANNING",
      description: "",
      endDate: "",
      thumbnailUrl: "",
    },
    mode: "onChange",
  });

  const handleSubmit = async (data: CreateProjectFormData) => {
    try {
      // Clean up data before submission
      const cleanedData = {
        ...data,
        description: data.description || undefined,
        endDate: data.endDate || undefined,
        thumbnailUrl: data.thumbnailUrl || undefined,
      };

      await onSubmit(cleanedData);
      form.reset();
      onOpenChange(false);
      onProjectCreated?.();
      addToast({
        type: "success",
        title: "Project Created",
        description: "Project has been created successfully!",
      });
    } catch (error) {
      console.error("Form submit error:", error);
      addToast({
        type: "error",
        title: "Failed to Create Project",
        description:
          error instanceof Error ? error.message : "Failed to create project",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  // Check if form is valid for submit button
  const watchedValues = form.watch();
  const isFormValid = watchedValues.name && watchedValues.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:mx-0"
        role="dialog"
        aria-labelledby="create-project-title"
        aria-describedby="create-project-description"
      >
        <DialogHeader>
          <DialogTitle id="create-project-title">Create Project</DialogTitle>
          <DialogDescription id="create-project-description">
            Create a new construction project to track progress and manage
            resources.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Project Name - Required */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="project-name">Project Name *</FormLabel>
                  <FormControl>
                    <Input
                      id="project-name"
                      placeholder="Enter project name"
                      {...field}
                      className={
                        form.formState.errors.name ? "border-destructive" : ""
                      }
                      aria-describedby={
                        form.formState.errors.name
                          ? "project-name-error"
                          : undefined
                      }
                    />
                  </FormControl>
                  <FormMessage id="project-name-error" />
                </FormItem>
              )}
            />

            {/* Status - Required */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="project-status">Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        id="project-status"
                        name="status"
                        data-testid="project-status"
                        className={
                          form.formState.errors.status
                            ? "border-destructive"
                            : ""
                        }
                        aria-describedby={
                          form.formState.errors.status
                            ? "project-status-error"
                            : undefined
                        }
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage id="project-status-error" />
                </FormItem>
              )}
            />

            {/* Description - Optional */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="project-description">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      id="project-description"
                      name="description"
                      placeholder="Enter project description"
                      className="resize-none"
                      rows={3}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      aria-describedby={
                        form.formState.errors.description
                          ? "project-description-error"
                          : undefined
                      }
                    />
                  </FormControl>
                  <FormMessage id="project-description-error" />
                </FormItem>
              )}
            />

            {/* End Date - Optional */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="project-end-date">End Date</FormLabel>
                  <FormControl>
                    <Input
                      id="project-end-date"
                      name="endDate"
                      type="date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      className={
                        form.formState.errors.endDate
                          ? "border-destructive"
                          : ""
                      }
                      aria-describedby={
                        form.formState.errors.endDate
                          ? "project-end-date-error"
                          : undefined
                      }
                    />
                  </FormControl>
                  <FormMessage id="project-end-date-error" />
                </FormItem>
              )}
            />

            {/* Thumbnail Upload - Optional */}
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="project-thumbnail">
                    Project Thumbnail
                  </FormLabel>
                  <FormControl>
                    <CloudinaryUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onRemove={() => field.onChange("")}
                      accept="image/*"
                      maxSize={5}
                      folder="projects"
                      publicId={`project_${Date.now()}`}
                      className={
                        form.formState.errors.thumbnailUrl
                          ? "border-destructive"
                          : ""
                      }
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage id="project-thumbnail-error" />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
                role="button"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || form.formState.isSubmitting}
                className="w-full sm:w-auto"
                role="button"
                data-testid="submit-button"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Export trigger button component for easy use
export function CreateProjectButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      role="button"
      data-testid="create-project-button"
      className="w-full sm:w-auto"
    >
      Create Project
    </Button>
  );
}
