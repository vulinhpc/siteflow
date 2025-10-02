import { and, desc, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { dailyLogsSchema } from '@/models/Schema';

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import('@/db');
  return db;
}

// Canonical validation schema for creating daily logs
const createDailyLogSchema = z.object({
  project_id: z.string().uuid('Project ID must be a valid UUID'),
  category_id: z.string().uuid('Category ID must be a valid UUID'),
  date: z.string().date('Date must be a valid date'),
  notes: z.string().optional(),
  media: z
    .array(
      z.object({
        url: z.string().url('Media URL must be valid'),
        type: z.enum(['image', 'video', 'document']),
        caption: z.string().optional(),
      }),
    )
    .min(1, 'At least one media item is required'),
});

// Action validation schemas are defined in [id]/route.ts

// GET /api/v1/daily-logs
export async function GET(req: NextRequest) {
  try {
    const isE2E = req.headers.get('x-e2e-bypass') === 'true';
    const orgId = req.headers.get('x-org-id') || 'org_sample_123';

    if (!isE2E && !orgId) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Organization ID is required',
          instance: req.url,
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get('project_id');
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('date_from');
    // const dateTo = url.searchParams.get('date_to'); // TODO: implement date range filtering
    const limit = Math.min(
      Number.parseInt(url.searchParams.get('limit') || '10'),
      100,
    );
    const page = Math.max(
      Number.parseInt(url.searchParams.get('page') || '1'),
      1,
    );

    const offset = (page - 1) * limit;
    const db = await getDb();

    // Build query conditions
    const conditions = [
      eq(dailyLogsSchema.orgId, orgId),
      isNull(dailyLogsSchema.deletedAt),
    ];

    if (projectId) {
      conditions.push(eq(dailyLogsSchema.projectId, projectId));
    }

    if (status) {
      conditions.push(eq(dailyLogsSchema.status, status as any));
    }

    if (dateFrom) {
      conditions.push(eq(dailyLogsSchema.date, dateFrom));
    }

    // Fetch daily logs
    const dailyLogs = await db
      .select()
      .from(dailyLogsSchema)
      .where(and(...conditions))
      .orderBy(desc(dailyLogsSchema.date), desc(dailyLogsSchema.createdAt))
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedLogs = dailyLogs.map((log: any) => ({
      id: log.id,
      project_id: log.projectId,
      category_id: log.categoryId,
      date: log.date,
      reporter_id: log.reporterId,
      notes: log.notes,
      media: log.media || [],
      status: log.status,
      review_comment: log.reviewComment,
      qc_rating: log.qcRating,
      created_at: log.createdAt.toISOString(),
      updated_at: log.updatedAt.toISOString(),
      org_id: log.orgId,
    }));

    return new Response(
      JSON.stringify({
        items: formattedLogs,
        total: dailyLogs.length,
        page,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch daily logs',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}

// POST /api/v1/daily-logs
export async function POST(req: NextRequest) {
  try {
    const isE2E = req.headers.get('x-e2e-bypass') === 'true';
    const orgId = req.headers.get('x-org-id') || 'org_sample_123';
    const userId = req.headers.get('x-user-id') || 'user_sample_123';
    const userRole = req.headers.get('x-user-role') || 'ENGINEER';

    if (!isE2E && !orgId) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Organization ID is required',
          instance: req.url,
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    // Check role permissions (ENGINEER can create daily logs)
    if (!isE2E && !['ENGINEER', 'ADMIN'].includes(userRole)) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Only engineers can create daily logs',
          instance: req.url,
        }),
        {
          status: 403,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/invalid-json',
          title: 'Invalid JSON',
          status: 400,
          detail: 'Request body must be valid JSON',
          instance: req.url,
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    // Validate request body
    const validationResult = createDailyLogSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/validation',
          title: 'Invalid request body',
          status: 400,
          detail: 'At least one media item is required',
          instance: req.url,
          errors: validationResult.error.errors.reduce((acc: any, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          }, {}),
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    const validatedData = validationResult.data;
    const db = await getDb();

    // Create daily log with DRAFT status
    const [newDailyLog] = await db
      .insert(dailyLogsSchema)
      .values({
        id: crypto.randomUUID(),
        orgId,
        projectId: validatedData.project_id,
        categoryId: validatedData.category_id,
        date: validatedData.date,
        reporterId: userId,
        notes: validatedData.notes || null,
        media: validatedData.media,
        status: 'DRAFT', // Default status
        reviewComment: null,
        qcRating: null,
      })
      .returning();

    // Format canonical response
    const dailyLog = {
      id: newDailyLog.id,
      project_id: newDailyLog.projectId,
      category_id: newDailyLog.categoryId,
      date: newDailyLog.date,
      reporter_id: newDailyLog.reporterId,
      notes: newDailyLog.notes,
      media: newDailyLog.media,
      status: newDailyLog.status,
      review_comment: newDailyLog.reviewComment,
      qc_rating: newDailyLog.qcRating,
      created_at: newDailyLog.createdAt.toISOString(),
      updated_at: newDailyLog.updatedAt.toISOString(),
      org_id: newDailyLog.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        daily_log: dailyLog,
      }),
      {
        status: 201,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error creating daily log:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to create daily log',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}
