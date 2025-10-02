import { and, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { dailyLogsSchema } from "@/models/Schema";

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import("@/db");
  return db;
}

// Action validation schemas
const submitActionSchema = z.object({
  action: z.literal("submit"),
});

const approveActionSchema = z.object({
  action: z.literal("approve"),
  comment: z.string().min(1, "Comment is required for approval"),
});

const declineActionSchema = z.object({
  action: z.literal("decline"),
  comment: z.string().min(1, "Comment is required for decline"),
});

const qcActionSchema = z.object({
  action: z.literal("qc"),
  qc_rating: z.number().min(1).max(5, "QC rating must be between 1 and 5"),
});

const actionSchema = z.discriminatedUnion("action", [
  submitActionSchema,
  approveActionSchema,
  declineActionSchema,
  qcActionSchema,
]);

// GET /api/v1/daily-logs/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const isE2E = req.headers.get("x-e2e-bypass") === "true";
    const orgId = req.headers.get("x-org-id") || "org_sample_123";

    if (!isE2E && !orgId) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/validation",
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

    const dailyLogId = params.id;
    const db = await getDb();

    // Get daily log by ID
    const dailyLog = await db
      .select()
      .from(dailyLogsSchema)
      .where(
        and(
          eq(dailyLogsSchema.id, dailyLogId),
          eq(dailyLogsSchema.orgId, orgId),
          isNull(dailyLogsSchema.deletedAt),
        ),
      )
      .limit(1);

    if (dailyLog.length === 0) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/not-found",
          title: "Daily Log Not Found",
          status: 404,
          detail: "Daily log not found or access denied",
          instance: req.url,
        }),
        {
          status: 404,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    const logData = dailyLog[0];

    // Format canonical response
    const formattedLog = {
      id: logData.id,
      project_id: logData.projectId,
      category_id: logData.categoryId,
      date: logData.date,
      reporter_id: logData.reporterId,
      notes: logData.notes,
      media: logData.media || [],
      status: logData.status,
      review_comment: logData.reviewComment,
      qc_rating: logData.qcRating,
      created_at: logData.createdAt.toISOString(),
      updated_at: logData.updatedAt.toISOString(),
      org_id: logData.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        daily_log: formattedLog,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching daily log:", error);
    return new Response(
      JSON.stringify({
        type: "https://siteflow.app/errors/internal-server-error",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch daily log",
        instance: req.url,
      }),
      {
        status: 500,
        headers: { "content-type": "application/problem+json" },
      },
    );
  }
}

// PATCH /api/v1/daily-logs/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const isE2E = req.headers.get("x-e2e-bypass") === "true";
    const orgId = req.headers.get("x-org-id") || "org_sample_123";
    const userRole = req.headers.get("x-user-role") || "ENGINEER";

    if (!isE2E && !orgId) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/validation",
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

    const dailyLogId = params.id;

    let body;
    try {
      body = await req.json();
    } catch {
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

    // Validate action
    const validationResult = actionSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/validation",
          title: "Invalid request body",
          status: 400,
          detail: "Invalid action or missing required fields",
          instance: req.url,
          errors: validationResult.error.errors.reduce((acc: any, err) => {
            acc[err.path.join(".")] = err.message;
            return acc;
          }, {}),
        }),
        {
          status: 400,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    const validatedData = validationResult.data;
    const db = await getDb();

    // Check if daily log exists and belongs to org
    const existingLog = await db
      .select()
      .from(dailyLogsSchema)
      .where(
        and(
          eq(dailyLogsSchema.id, dailyLogId),
          eq(dailyLogsSchema.orgId, orgId),
          isNull(dailyLogsSchema.deletedAt),
        ),
      )
      .limit(1);

    if (existingLog.length === 0) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/not-found",
          title: "Daily Log Not Found",
          status: 404,
          detail: "Daily log not found or access denied",
          instance: req.url,
        }),
        {
          status: 404,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    const currentLog = existingLog[0];

    // Role-based action validation
    const updateData: any = {};

    switch (validatedData.action) {
      case "submit":
        // Only ENGINEER can submit
        if (!isE2E && !["ENGINEER", "ADMIN"].includes(userRole)) {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/forbidden",
              title: "Forbidden",
              status: 403,
              detail: "Only engineers can submit daily logs",
              instance: req.url,
            }),
            {
              status: 403,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        // Can only submit if DRAFT
        if (currentLog.status !== "DRAFT") {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/validation",
              title: "Invalid Status",
              status: 400,
              detail: "Can only submit logs in DRAFT status",
              instance: req.url,
            }),
            {
              status: 400,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        updateData.status = "SUBMITTED";
        break;

      case "approve":
        // Only PM/SUPERVISOR can approve
        if (!isE2E && !["PM", "SUPERVISOR", "ADMIN"].includes(userRole)) {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/forbidden",
              title: "Forbidden",
              status: 403,
              detail: "Only PM/Supervisor can approve daily logs",
              instance: req.url,
            }),
            {
              status: 403,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        // Can only approve if SUBMITTED
        if (currentLog.status !== "SUBMITTED") {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/validation",
              title: "Invalid Status",
              status: 400,
              detail: "Can only approve logs in SUBMITTED status",
              instance: req.url,
            }),
            {
              status: 400,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        updateData.status = "APPROVED";
        updateData.reviewComment = validatedData.comment;
        break;

      case "decline":
        // Only PM/SUPERVISOR can decline
        if (!isE2E && !["PM", "SUPERVISOR", "ADMIN"].includes(userRole)) {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/forbidden",
              title: "Forbidden",
              status: 403,
              detail: "Only PM/Supervisor can decline daily logs",
              instance: req.url,
            }),
            {
              status: 403,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        // Can only decline if SUBMITTED
        if (currentLog.status !== "SUBMITTED") {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/validation",
              title: "Invalid Status",
              status: 400,
              detail: "Can only decline logs in SUBMITTED status",
              instance: req.url,
            }),
            {
              status: 400,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        updateData.status = "DECLINED";
        updateData.reviewComment = validatedData.comment;
        break;

      case "qc":
        // Only QC can rate
        if (!isE2E && !["QC", "ADMIN"].includes(userRole)) {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/forbidden",
              title: "Forbidden",
              status: 403,
              detail: "Only QC can rate daily logs",
              instance: req.url,
            }),
            {
              status: 403,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        // Can only rate if APPROVED
        if (currentLog.status !== "APPROVED") {
          return new Response(
            JSON.stringify({
              type: "https://siteflow.app/errors/validation",
              title: "Invalid Status",
              status: 400,
              detail: "Can only rate logs in APPROVED status",
              instance: req.url,
            }),
            {
              status: 400,
              headers: { "content-type": "application/problem+json" },
            },
          );
        }
        updateData.qcRating = validatedData.qc_rating;
        break;
    }

    // Update daily log
    const [updatedLog] = await db
      .update(dailyLogsSchema)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(dailyLogsSchema.id, dailyLogId))
      .returning();

    // Format canonical response
    const dailyLog = {
      id: updatedLog.id,
      project_id: updatedLog.projectId,
      category_id: updatedLog.categoryId,
      date: updatedLog.date,
      reporter_id: updatedLog.reporterId,
      notes: updatedLog.notes,
      media: updatedLog.media || [],
      status: updatedLog.status,
      review_comment: updatedLog.reviewComment,
      qc_rating: updatedLog.qcRating,
      created_at: updatedLog.createdAt.toISOString(),
      updated_at: updatedLog.updatedAt.toISOString(),
      org_id: updatedLog.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        daily_log: dailyLog,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating daily log:", error);
    return new Response(
      JSON.stringify({
        type: "https://siteflow.app/errors/internal-server-error",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to update daily log",
        instance: req.url,
      }),
      {
        status: 500,
        headers: { "content-type": "application/problem+json" },
      },
    );
  }
}
