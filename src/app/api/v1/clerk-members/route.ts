import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { membershipsSchema, usersSchema } from '@/models/Schema';

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import('@/db');
  return db;
}

// GET /api/v1/clerk-members
export async function GET(req: NextRequest) {
  try {
    const isE2E = req.headers.get('x-e2e-bypass') === 'true';
    const orgId = req.headers.get('x-org-id') || 'org_sample_123';

    if (!isE2E && !orgId) {
      return new Response(
        JSON.stringify({
          type: 'https://example.com/probs/validation-error',
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

    const db = await getDb();

    // Fetch organization members with their details
    const members = await db
      .select({
        id: membershipsSchema.id,
        userId: membershipsSchema.userId,
        role: membershipsSchema.role,
        isActive: membershipsSchema.isActive,
        clerkUserId: usersSchema.clerkUserId,
        email: usersSchema.email,
        name: usersSchema.name,
        displayName: usersSchema.displayName,
        avatarUrl: usersSchema.avatarUrl,
        createdAt: membershipsSchema.createdAt,
      })
      .from(membershipsSchema)
      .innerJoin(usersSchema, eq(membershipsSchema.userId, usersSchema.id))
      .where(
        and(
          eq(membershipsSchema.orgId, orgId),
          eq(membershipsSchema.isActive, true),
        ),
      )
      .orderBy(membershipsSchema.createdAt);

    // Format response
    const formattedMembers = members.map((member: any) => ({
      id: member.id,
      userId: member.userId,
      clerkUserId: member.clerkUserId,
      email: member.email,
      name: member.name,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      role: member.role,
      isActive: member.isActive,
      createdAt: member.createdAt.toISOString(),
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        members: formattedMembers,
        totalCount: formattedMembers.length,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return new Response(
      JSON.stringify({
        type: 'https://example.com/probs/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch organization members',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}
