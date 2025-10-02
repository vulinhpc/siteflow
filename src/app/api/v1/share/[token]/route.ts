import { and, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";

import {
  dailyLogsSchema,
  projectsSchema,
  shareLinksSchema,
} from "@/models/Schema";

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import("@/db");
  return db;
}

// GET /api/v1/share/:token - Public endpoint
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const token = params.token;
    const db = await getDb();

    // Get share link by token
    const shareLink = await db
      .select()
      .from(shareLinksSchema)
      .where(
        and(
          eq(shareLinksSchema.token, token),
          isNull(shareLinksSchema.deletedAt),
        ),
      )
      .limit(1);

    if (shareLink.length === 0) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/not-found",
          title: "Share Link Not Found",
          status: 404,
          detail: "Share link not found or expired",
          instance: req.url,
        }),
        {
          status: 404,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    const linkData = shareLink[0];

    // Check if link is expired
    if (linkData.expiresAt && new Date() > linkData.expiresAt) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/expired",
          title: "Share Link Expired",
          status: 410,
          detail: "This share link has expired",
          instance: req.url,
        }),
        {
          status: 410,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    // Get project details
    const project = await db
      .select()
      .from(projectsSchema)
      .where(
        and(
          eq(projectsSchema.id, linkData.projectId),
          isNull(projectsSchema.deletedAt),
        ),
      )
      .limit(1);

    if (project.length === 0) {
      return new Response(
        JSON.stringify({
          type: "https://siteflow.app/errors/not-found",
          title: "Project Not Found",
          status: 404,
          detail: "Associated project not found",
          instance: req.url,
        }),
        {
          status: 404,
          headers: { "content-type": "application/problem+json" },
        },
      );
    }

    const projectData = project[0];

    // Get APPROVED daily logs only
    const approvedLogs = await db
      .select()
      .from(dailyLogsSchema)
      .where(
        and(
          eq(dailyLogsSchema.projectId, linkData.projectId),
          eq(dailyLogsSchema.status, "APPROVED"),
          isNull(dailyLogsSchema.deletedAt),
        ),
      )
      .orderBy(dailyLogsSchema.date);

    // Format project data
    const formattedProject = {
      id: projectData.id,
      name: projectData.name,
      status: projectData.status,
      start_date: projectData.startDate?.toISOString().split("T")[0],
      end_date: projectData.endDate?.toISOString().split("T")[0] || null,
      description: projectData.description,
      thumbnail_url: projectData.thumbnailUrl,
      address: projectData.address,
      scale: projectData.scale,
      // Conditionally include budget info
      ...(linkData.hideFinance
        ? {}
        : {
            budget_total: projectData.budgetTotal
              ? Number(projectData.budgetTotal)
              : null,
            currency: projectData.currency,
          }),
      // Conditionally include investor contact
      ...(linkData.showInvestorContact
        ? {
            investor_name: projectData.investorName,
            investor_phone: projectData.investorPhone,
          }
        : {}),
    };

    // Format daily logs with QC badges
    const formattedLogs = approvedLogs.map((log: any) => ({
      id: log.id,
      date: log.date,
      notes: log.notes,
      media: log.media || [],
      status: log.status,
      review_comment: log.reviewComment,
      qc_rating: log.qcRating,
      created_at: log.createdAt.toISOString(),
    }));

    // Calculate progress (simplified - would need categories/tasks for full calculation)
    const totalLogs = formattedLogs.length;
    const progress =
      totalLogs > 0 ? Math.round((totalLogs / (totalLogs + 5)) * 100) : 0; // Simplified calculation

    return new Response(
      JSON.stringify({
        ok: true,
        project: formattedProject,
        daily_logs: formattedLogs,
        progress: {
          percentage: progress,
          total_logs: totalLogs,
          approved_logs: totalLogs,
        },
        share_settings: {
          hide_finance: linkData.hideFinance,
          show_investor_contact: linkData.showInvestorContact,
          expires_at: linkData.expiresAt?.toISOString() || null,
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          // Add CORS headers for public access
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching share data:", error);
    return new Response(
      JSON.stringify({
        type: "https://siteflow.app/errors/internal-server-error",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch share data",
        instance: req.url,
      }),
      {
        status: 500,
        headers: { "content-type": "application/problem+json" },
      },
    );
  }
}
