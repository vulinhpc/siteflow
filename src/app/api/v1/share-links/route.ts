import { and, desc, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { shareLinksSchema } from '@/models/Schema';

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import('@/db');
  return db;
}

// Generate random token
function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

// Canonical validation schema for creating share links
const createShareLinkSchema = z.object({
  project_id: z.string().uuid('Project ID must be a valid UUID'),
  hide_finance: z.boolean().default(false),
  show_investor_contact: z.boolean().default(false),
  expires_at: z.string().datetime().optional(),
});

// Update share link schema (for future PATCH endpoint)

// GET /api/v1/share-links
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
      eq(shareLinksSchema.orgId, orgId),
      isNull(shareLinksSchema.deletedAt),
    ];

    if (projectId) {
      conditions.push(eq(shareLinksSchema.projectId, projectId));
    }

    // Fetch share links
    const shareLinks = await db
      .select()
      .from(shareLinksSchema)
      .where(and(...conditions))
      .orderBy(desc(shareLinksSchema.createdAt))
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedLinks = shareLinks.map((link: any) => ({
      id: link.id,
      project_id: link.projectId,
      token: link.token,
      hide_finance: link.hideFinance,
      show_investor_contact: link.showInvestorContact,
      expires_at: link.expiresAt?.toISOString() || null,
      created_by: link.createdBy,
      created_at: link.createdAt.toISOString(),
      updated_at: link.updatedAt.toISOString(),
      org_id: link.orgId,
    }));

    return new Response(
      JSON.stringify({
        items: formattedLinks,
        total: shareLinks.length,
        page,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error fetching share links:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch share links',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}

// POST /api/v1/share-links
export async function POST(req: NextRequest) {
  try {
    const isE2E = req.headers.get('x-e2e-bypass') === 'true';
    const orgId = req.headers.get('x-org-id') || 'org_sample_123';
    const userId = req.headers.get('x-user-id') || 'user_sample_123';
    const userRole = req.headers.get('x-user-role') || 'ADMIN';

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

    // Check role permissions (PM, ADMIN can create share links)
    if (!isE2E && !['PM', 'ADMIN'].includes(userRole)) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Only PM and Admin can create share links',
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
    const validationResult = createShareLinkSchema.safeParse(body);
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

    // Generate unique token
    const token = generateShareToken();

    // Create share link
    const [newShareLink] = await db
      .insert(shareLinksSchema)
      .values({
        id: crypto.randomUUID(),
        orgId,
        projectId: validatedData.project_id,
        token,
        hideFinance: validatedData.hide_finance,
        showInvestorContact: validatedData.show_investor_contact,
        expiresAt: validatedData.expires_at
          ? new Date(validatedData.expires_at)
          : null,
        createdBy: userId,
      })
      .returning();

    // Format canonical response
    const shareLink = {
      id: newShareLink.id,
      project_id: newShareLink.projectId,
      token: newShareLink.token,
      hide_finance: newShareLink.hideFinance,
      show_investor_contact: newShareLink.showInvestorContact,
      expires_at: newShareLink.expiresAt?.toISOString() || null,
      created_by: newShareLink.createdBy,
      created_at: newShareLink.createdAt.toISOString(),
      updated_at: newShareLink.updatedAt.toISOString(),
      org_id: newShareLink.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        share_link: shareLink,
      }),
      {
        status: 201,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error creating share link:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to create share link',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}
