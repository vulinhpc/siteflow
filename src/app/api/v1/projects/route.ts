import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { projectsSchema } from "@/models/Schema";

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import("@/db");
  return db;
}

// Member schema for project assignment (removed - not used in canonical API)

// Canonical validation schema
const createProjectSchema = z
  .object({
    name: z.string().min(1, "Project name is required").max(255),
    status: z
      .enum(["planning", "in_progress", "on_hold", "completed"])
      .default("planning"),
    start_date: z
      .string()
      .date("Start date is required and must be a valid date"),
    end_date: z.string().date("End date must be a valid date").optional(),
    budget_total: z.number().min(0, "Budget must be non-negative").optional(),
    currency: z.string().default("VND"),
    address: z.string().optional(),
    scale: z
      .object({
        area_m2: z.number().optional(),
        floors: z.number().optional(),
        notes: z.string().optional(),
      })
      .optional(),
    investor_name: z.string().optional(),
    investor_phone: z.string().optional(),
    description: z.string().optional(),
    thumbnail_url: z.string().url("Thumbnail URL must be valid").optional(),
  })
  .refine(
    (data) => {
      // Ensure start_date is before or equal to end_date if both are provided
      if (data.start_date && data.end_date) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        return start <= end;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["start_date"],
    },
  );

// Helper functions (removed cursor-based pagination helpers)

// GET /api/v1/projects
export async function GET(req: NextRequest) {
  try {
    const isE2E = req.headers.get("x-e2e-bypass") === "true";
    const orgId = req.headers.get("x-org-id") || "org_sample_123";

    if (!isE2E && !orgId) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Organization ID is required",
          instance: req.url,
        }),
        {
          status: 400,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    const url = new URL(req.url);
    const limit = Math.min(
      Number.parseInt(url.searchParams.get("limit") || "10"),
      100,
    );
    const page = Math.max(
      Number.parseInt(url.searchParams.get("page") || "1"),
      1,
    );
    const q = url.searchParams.get("q") || "";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [
      eq(projectsSchema.orgId, orgId),
      isNull(projectsSchema.deletedAt),
    ];

    const db = await getDb();

    // Get total count for pagination with error logging
    let total = 0;
    try {
      // Fetching projects with conditions
      const totalCountResult = await db
        .select({ count: count() })
        .from(projectsSchema)
        .where(and(...conditions));
      total = totalCountResult[0]?.count || 0;
      // Total projects count retrieved
    } catch (error) {
      console.error("Error fetching projects count:", error);
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/database-error",
          title: "Database Error",
          status: 500,
          detail: "Failed to fetch projects count",
          instance: req.url,
          errors: [
            {
              field: "database",
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown database error",
            },
          ],
        }),
        {
          status: 500,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Fetch projects from database with offset-based pagination
    let projects = [];
    try {
      projects = await db
        .select()
        .from(projectsSchema)
        .where(and(...conditions))
        .orderBy(desc(projectsSchema.createdAt), desc(projectsSchema.id))
        .limit(limit)
        .offset(offset);
      // Projects fetched successfully
    } catch (error) {
      console.error("Error fetching projects:", error);
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/database-error",
          title: "Database Error",
          status: 500,
          detail: "Failed to fetch projects",
          instance: req.url,
          errors: [
            {
              field: "database",
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown database error",
            },
          ],
        }),
        {
          status: 500,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    // Apply search filter in memory (for now)
    const filteredItems = q
      ? projects.filter(
          (p: any) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            (p.description &&
              p.description.toLowerCase().includes(q.toLowerCase())),
        )
      : projects;

    // Format response with canonical fields
    const formattedItems = filteredItems.map((project: any) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      start_date: project.startDate?.toISOString().split("T")[0],
      end_date: project.endDate?.toISOString().split("T")[0] || null,
      budget_total: project.budgetTotal ? Number(project.budgetTotal) : null,
      currency: project.currency || "VND",
      description: project.description,
      thumbnail_url: project.thumbnailUrl,
      address: project.address,
      scale: project.scale,
      investor_name: project.investorName,
      investor_phone: project.investorPhone,
      created_at: project.createdAt.toISOString(),
      updated_at: project.updatedAt.toISOString(),
      org_id: project.orgId,
    }));

    return new Response(
      JSON.stringify({
        items: formattedItems,
        total,
        page,
        totalPages,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return new Response(
      JSON.stringify({
        type: "https://siteflow.app/errors/internal-server-error",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch projects",
        instance: req.url,
      }),
      {
        status: 500,
        headers: { "content-type": "application/problem+json" },
      },
    );
  }
}

// POST /api/v1/projects
export async function POST(req: NextRequest) {
  try {
    const isE2E = req.headers.get("x-e2e-bypass") === "true";
    const orgId = req.headers.get("x-org-id") || "org_sample_123";

    if (!isE2E && !orgId) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Organization ID is required",
          instance: req.url,
        }),
        {
          status: 400,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("JSON parsing error:", error);
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/invalid-json",
          title: "Invalid JSON",
          status: 400,
          detail: "Request body must be valid JSON",
          instance: req.url,
        }),
        {
          status: 400,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    // Validate request body
    const validationResult = createProjectSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid request data",
          instance: req.url,
          errors: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    const validatedData = validationResult.data;

    const db = await getDb();

    // Create project in database with detailed error logging
    let newProject: any;
    try {
      // Creating project with validated data

      const [result] = await db
        .insert(projectsSchema)
        .values({
          id: crypto.randomUUID(),
          orgId,
          name: validatedData.name,
          status: validatedData.status,
          startDate: validatedData.start_date,
          endDate: validatedData.end_date || null,
          budgetTotal: validatedData.budget_total?.toString() ?? null,
          currency: validatedData.currency,
          description: validatedData.description ?? null,
          thumbnailUrl: validatedData.thumbnail_url ?? null,
          address: validatedData.address ?? null,
          scale: validatedData.scale ?? null,
          investorName: validatedData.investor_name ?? null,
          investorPhone: validatedData.investor_phone ?? null,
        })
        .returning();

      newProject = result;
      // Project created successfully

      // Project members functionality removed for canonical API
    } catch (error) {
      console.error("=== DATABASE INSERT ERROR ===");
      console.error("Error:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : undefined,
      );
      console.error("OrgId:", orgId);
      console.error("Validated data:", validatedData);
      console.error("Request body:", body);
      console.error("===============================");

      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/database-error",
          title: "Database Error",
          status: 500,
          detail:
            error instanceof Error
              ? error.message
              : "Failed to create project in database",
          instance: req.url,
          errors: [
            {
              field: "database",
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown database error",
            },
          ],
        }),
        {
          status: 500,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    if (!newProject) {
      console.error("Project creation returned null/undefined");
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/database-error",
          title: "Database Error",
          status: 500,
          detail: "Project creation returned no result",
          instance: req.url,
        }),
        {
          status: 500,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    // Format canonical response
    const project = {
      id: newProject.id,
      name: newProject.name,
      status: newProject.status,
      start_date: newProject.startDate?.toISOString().split("T")[0],
      end_date: newProject.endDate?.toISOString().split("T")[0] || null,
      budget_total: newProject.budgetTotal
        ? Number(newProject.budgetTotal)
        : null,
      currency: newProject.currency,
      description: newProject.description,
      thumbnail_url: newProject.thumbnailUrl,
      address: newProject.address,
      scale: newProject.scale,
      investor_name: newProject.investorName,
      investor_phone: newProject.investorPhone,
      created_at: newProject.createdAt.toISOString(),
      updated_at: newProject.updatedAt.toISOString(),
      org_id: newProject.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        project,
      }),
      {
        status: 201,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return new Response(
      JSON.stringify({
        type: "https://siteflow.app/errors/internal-server-error",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to create project",
        instance: req.url,
      }),
      {
        status: 500,
        headers: { "content-type": "application/problem+json" },
      },
    );
  }
}
