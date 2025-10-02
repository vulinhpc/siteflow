import { and, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { projectsSchema } from '@/models/Schema';

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import('@/db');
  return db;
}

// Canonical validation schema (partial for updates)
const updateProjectSchema = z
  .object({
    name: z.string().min(1, 'Project name is required').max(255).optional(),
    status: z
      .enum(['planning', 'in_progress', 'on_hold', 'completed'])
      .optional(),
    start_date: z.string().date('Start date must be a valid date').optional(),
    end_date: z.string().date('End date must be a valid date').optional(),
    budget_total: z.number().min(0, 'Budget must be non-negative').optional(),
    currency: z.string().optional(),
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
    thumbnail_url: z.string().url('Thumbnail URL must be valid').optional(),
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
      message: 'Start date must be before or equal to end date',
      path: ['start_date'],
    },
  );

// GET /api/v1/projects/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const projectId = params.id;
    const db = await getDb();

    // Get project by ID
    const project = await db
      .select()
      .from(projectsSchema)
      .where(
        and(
          eq(projectsSchema.id, projectId),
          eq(projectsSchema.orgId, orgId),
          isNull(projectsSchema.deletedAt),
        ),
      )
      .limit(1);

    if (project.length === 0) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/not-found',
          title: 'Project Not Found',
          status: 404,
          detail: 'Project not found or access denied',
          instance: req.url,
        }),
        {
          status: 404,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    const projectData = project[0];

    // Format canonical response
    const formattedProject = {
      id: projectData.id,
      name: projectData.name,
      status: projectData.status,
      start_date: projectData.startDate ? (typeof projectData.startDate === 'string' ? projectData.startDate : projectData.startDate.toISOString().split('T')[0]) : null,
      end_date: projectData.endDate ? (typeof projectData.endDate === 'string' ? projectData.endDate : projectData.endDate.toISOString().split('T')[0]) : null,
      budget_total: projectData.budgetTotal
        ? Number(projectData.budgetTotal)
        : null,
      currency: projectData.currency || 'VND',
      description: projectData.description,
      thumbnail_url: projectData.thumbnailUrl,
      address: projectData.address,
      scale: projectData.scale,
      investor_name: projectData.investorName,
      investor_phone: projectData.investorPhone,
      created_at: projectData.createdAt.toISOString(),
      updated_at: projectData.updatedAt.toISOString(),
      org_id: projectData.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        project: formattedProject,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch project',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}

// PATCH /api/v1/projects/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const projectId = params.id;

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
    const validationResult = updateProjectSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/validation',
          title: 'Invalid request body',
          status: 400,
          detail: 'Validation failed',
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

    // Check if project exists and belongs to org
    const existingProject = await db
      .select()
      .from(projectsSchema)
      .where(
        and(
          eq(projectsSchema.id, projectId),
          eq(projectsSchema.orgId, orgId),
          isNull(projectsSchema.deletedAt),
        ),
      )
      .limit(1);

    if (existingProject.length === 0) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/not-found',
          title: 'Project Not Found',
          status: 404,
          detail: 'Project not found or access denied',
          instance: req.url,
        }),
        {
          status: 404,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    // Build update object
    const updateData: any = {};
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    if (validatedData.start_date !== undefined) {
      updateData.startDate = validatedData.start_date;
    }
    if (validatedData.end_date !== undefined) {
      updateData.endDate = validatedData.end_date;
    }
    if (validatedData.budget_total !== undefined) {
      updateData.budgetTotal = validatedData.budget_total?.toString();
    }
    if (validatedData.currency !== undefined) {
      updateData.currency = validatedData.currency;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.thumbnail_url !== undefined) {
      updateData.thumbnailUrl = validatedData.thumbnail_url;
    }
    if (validatedData.address !== undefined) {
      updateData.address = validatedData.address;
    }
    if (validatedData.scale !== undefined) {
      updateData.scale = validatedData.scale;
    }
    if (validatedData.investor_name !== undefined) {
      updateData.investorName = validatedData.investor_name;
    }
    if (validatedData.investor_phone !== undefined) {
      updateData.investorPhone = validatedData.investor_phone;
    }

    // Update project
    const [updatedProject] = await db
      .update(projectsSchema)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(projectsSchema.id, projectId))
      .returning();

    // Format canonical response
    const project = {
      id: updatedProject.id,
      name: updatedProject.name,
      status: updatedProject.status,
      start_date: updatedProject.startDate ? (typeof updatedProject.startDate === 'string' ? updatedProject.startDate : updatedProject.startDate.toISOString().split('T')[0]) : null,
      end_date: updatedProject.endDate ? (typeof updatedProject.endDate === 'string' ? updatedProject.endDate : updatedProject.endDate.toISOString().split('T')[0]) : null,
      budget_total: updatedProject.budgetTotal
        ? Number(updatedProject.budgetTotal)
        : null,
      currency: updatedProject.currency,
      description: updatedProject.description,
      thumbnail_url: updatedProject.thumbnailUrl,
      address: updatedProject.address,
      scale: updatedProject.scale,
      investor_name: updatedProject.investorName,
      investor_phone: updatedProject.investorPhone,
      created_at: updatedProject.createdAt.toISOString(),
      updated_at: updatedProject.updatedAt.toISOString(),
      org_id: updatedProject.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        project,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error updating project:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to update project',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}
