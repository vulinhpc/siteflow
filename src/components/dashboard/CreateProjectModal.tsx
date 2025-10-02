"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, PlusIcon, TrashIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox-simple";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-simple";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// Member schema for project assignment
const memberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(
    [
      "manager",
      "engineer",
      "accountant",
      "safety_supervisor",
      "design_engineer",
    ],
    {
      required_error: "Role is required",
    },
  ),
});

// Zod schema matching API requirements
const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, "Project name is required")
      .max(255, "Project name must be at most 255 characters"),
    status: z.enum(
      ["PLANNING", "IN_PROGRESS", "DONE", "ON_HOLD", "CANCELLED"],
      {
        required_error: "Project status is required",
      },
    ),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
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
    members: z.array(memberSchema).optional(),
    thumbnailUrl: z
      .string()
      .url("Invalid URL format")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // Ensure startDate is before or equal to endDate if both are provided
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return start <= end;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["startDate"],
    },
  );

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

// Hook to fetch organization users from API
function useOrganizationUsers() {
  const [users, setUsers] = React.useState<ComboboxOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch("/api/v1/clerk-members");
        const data = await response.json();

        if (data.ok) {
          const userOptions: ComboboxOption[] = data.members.map(
            (member: any) => ({
              value: member.clerkUserId,
              label: `${member.displayName || member.name || member.email} (${member.role})`,
            }),
          );
          setUsers(userOptions);
        } else {
          console.error("Failed to fetch users:", data);
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return { users, loading };
}

// Role options with icons
const roleOptions = [
  { value: "manager", label: "Manager", icon: "👨‍💼" },
  { value: "engineer", label: "Engineer", icon: "👨‍💻" },
  { value: "accountant", label: "Accountant", icon: "👨‍💼" },
  { value: "safety_supervisor", label: "Safety Supervisor", icon: "🛡️" },
  { value: "design_engineer", label: "Design Engineer", icon: "🎨" },
];

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
  const t = useTranslations("projects");
  const { users: organizationUsers, loading: usersLoading } =
    useOrganizationUsers();

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      status: "PLANNING",
      description: "",
      startDate: "",
      endDate: "",
      members: [],
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
  const isFormValid =
    watchedValues.name && watchedValues.status && watchedValues.startDate;

  // Add member function
  const addMember = () => {
    const currentMembers = form.getValues("members") || [];
    form.setValue("members", [
      ...currentMembers,
      { userId: "", role: "manager" as const },
    ]);
  };

  // Remove member function
  const removeMember = (index: number) => {
    const currentMembers = form.getValues("members") || [];
    const newMembers = currentMembers.filter((_, i) => i !== index);
    form.setValue("members", newMembers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto sm:mx-0"
        role="dialog"
        aria-labelledby="create-project-title"
        aria-describedby="create-project-description"
      >
        <DialogHeader>
          <DialogTitle id="create-project-title">
            {t("createProject")}
          </DialogTitle>
          <DialogDescription id="create-project-description">
            {t("createProjectDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Basic Information Section */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("basicInfo")}
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Project Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel htmlFor="project-name">
                        {t("projectName")} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="project-name"
                          placeholder={t("projectNamePlaceholder")}
                          {...field}
                          className={
                            form.formState.errors.name
                              ? "border-destructive"
                              : ""
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

                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="project-start-date">
                        {t("startDate")} *
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              id="project-start-date"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                form.formState.errors.startDate &&
                                  "border-destructive",
                              )}
                            >
                              <CalendarIcon className="mr-2 size-4" />
                              {field.value
                                ? new Date(field.value).toLocaleDateString()
                                : "Select start date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                field.onChange(
                                  date.toISOString().split("T")[0],
                                );
                              }
                            }}
                            disabled={(date: Date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage id="project-start-date-error" />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="project-end-date">
                        {t("endDate")}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              id="project-end-date"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground",
                                form.formState.errors.endDate &&
                                  "border-destructive",
                              )}
                            >
                              <CalendarIcon className="mr-2 size-4" />
                              {field.value
                                ? new Date(field.value).toLocaleDateString()
                                : "Select end date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                field.onChange(
                                  date.toISOString().split("T")[0],
                                );
                              }
                            }}
                            disabled={(date: Date) => {
                              const startDate = form.getValues("startDate");
                              if (startDate) {
                                return date < new Date(startDate);
                              }
                              return date < new Date("1900-01-01");
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage id="project-end-date-error" />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel htmlFor="project-status">
                        {t("status")} *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            id="project-status"
                            className={
                              form.formState.errors.status
                                ? "border-destructive"
                                : ""
                            }
                          >
                            <SelectValue placeholder={t("selectStatus")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PLANNING">
                            {t("planning")}
                          </SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            {t("inProgress")}
                          </SelectItem>
                          <SelectItem value="DONE">{t("completed")}</SelectItem>
                          <SelectItem value="ON_HOLD">{t("onHold")}</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage id="project-status-error" />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Details Section */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("details")}
              </h3>

              <div className="space-y-6">
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="project-description">
                        {t("description")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="project-description"
                          placeholder={t("descriptionPlaceholder")}
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Thumbnail Upload */}
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="project-thumbnail">
                        Project Thumbnail
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2">
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
                          <p className="text-sm text-muted-foreground">
                            Recommended size: 1200x600px
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Team Assignment Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Assignment
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="size-4" />
                  Add Member
                </Button>
              </div>

              <FormField
                control={form.control}
                name="members"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-4">
                        {field.value && field.value.length > 0 ? (
                          <div className="overflow-hidden rounded-lg border">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                    User
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                    Role
                                  </th>
                                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {field.value.map((member, index) => (
                                  <tr key={`member-${member.userId}-${index}`}>
                                    <td className="px-4 py-3">
                                      <Combobox
                                        options={organizationUsers}
                                        value={member.userId}
                                        onValueChange={(value) => {
                                          const newMembers = [
                                            ...(field.value || []),
                                          ];
                                          newMembers[index] = {
                                            ...newMembers[index],
                                            userId: value,
                                            role:
                                              newMembers[index]?.role ||
                                              "manager",
                                          };
                                          field.onChange(newMembers);
                                        }}
                                        placeholder="Select user"
                                        disabled={usersLoading}
                                        className="w-full"
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <Select
                                        value={member.role}
                                        onValueChange={(value) => {
                                          const newMembers = [
                                            ...(field.value || []),
                                          ];
                                          newMembers[index] = {
                                            ...newMembers[index],
                                            userId:
                                              newMembers[index]?.userId || "",
                                            role: value as any,
                                          };
                                          field.onChange(newMembers);
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {roleOptions.map((role) => (
                                            <SelectItem
                                              key={role.value}
                                              value={role.value}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span>{role.icon}</span>
                                                <span>{role.label}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeMember(index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <TrashIcon className="size-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                            <UserIcon className="mx-auto size-12 text-gray-400" />
                            <h4 className="mt-2 text-sm font-medium text-gray-900">
                              No team members assigned
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              Click "Add Member" to assign team members to this
                              project.
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || form.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("creating")}
                  </>
                ) : (
                  t("create")
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
