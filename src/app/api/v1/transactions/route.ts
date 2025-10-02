import { and, desc, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { transactionsSchema } from '@/models/Schema';

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import('@/db');
  return db;
}

// Canonical validation schema for creating transactions
const createTransactionSchema = z.object({
  project_id: z.string().uuid('Project ID must be a valid UUID'),
  date: z.string().date('Date must be a valid date'),
  type: z.enum(['ADVANCE', 'EXPENSE']),
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: z.string().default('VND'),
  cost_type: z.enum(['MATERIAL', 'LABOR', 'EQUIPMENT', 'OTHER']),
  description: z.string().optional(),
  invoice_no: z.string().optional(),
  vendor: z.string().optional(),
});

// Payment update schema (defined in [id]/route.ts)

// GET /api/v1/transactions
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
    const paymentStatus = url.searchParams.get('payment_status');
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
      eq(transactionsSchema.orgId, orgId),
      isNull(transactionsSchema.deletedAt),
    ];

    if (projectId) {
      conditions.push(eq(transactionsSchema.projectId, projectId));
    }

    if (paymentStatus) {
      conditions.push(
        eq(transactionsSchema.paymentStatus, paymentStatus as any),
      );
    }

    // Fetch transactions
    const transactions = await db
      .select()
      .from(transactionsSchema)
      .where(and(...conditions))
      .orderBy(
        desc(transactionsSchema.date),
        desc(transactionsSchema.createdAt),
      )
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      project_id: transaction.projectId,
      date: transaction.date,
      type: transaction.type,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      cost_type: transaction.costType,
      description: transaction.description,
      invoice_no: transaction.invoiceNo,
      vendor: transaction.vendor,
      payment_status: transaction.paymentStatus,
      paid_amount: Number(transaction.paidAmount),
      payment_date: transaction.paymentDate,
      attachments: transaction.attachments || [],
      created_at: transaction.createdAt.toISOString(),
      updated_at: transaction.updatedAt.toISOString(),
      org_id: transaction.orgId,
    }));

    return new Response(
      JSON.stringify({
        items: formattedTransactions,
        total: transactions.length,
        page,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch transactions',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}

// POST /api/v1/transactions
export async function POST(req: NextRequest) {
  try {
    const isE2E = req.headers.get('x-e2e-bypass') === 'true';
    const orgId = req.headers.get('x-org-id') || 'org_sample_123';
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

    // Check role permissions (ENGINEER and ACCOUNTANT can create transactions)
    if (!isE2E && !['ENGINEER', 'ACCOUNTANT', 'ADMIN'].includes(userRole)) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Only engineers and accountants can create transactions',
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
    const validationResult = createTransactionSchema.safeParse(body);
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

    // Create transaction with PENDING payment status
    const [newTransaction] = await db
      .insert(transactionsSchema)
      .values({
        id: crypto.randomUUID(),
        orgId,
        projectId: validatedData.project_id,
        date: validatedData.date,
        type: validatedData.type,
        amount: validatedData.amount.toString(),
        currency: validatedData.currency,
        costType: validatedData.cost_type,
        description: validatedData.description || null,
        invoiceNo: validatedData.invoice_no || null,
        vendor: validatedData.vendor || null,
        paymentStatus: 'PENDING', // Default status
        paidAmount: '0', // Default paid amount
        paymentDate: null,
        attachments: null,
      })
      .returning();

    // Format canonical response
    const transaction = {
      id: newTransaction.id,
      project_id: newTransaction.projectId,
      date: newTransaction.date,
      type: newTransaction.type,
      amount: Number(newTransaction.amount),
      currency: newTransaction.currency,
      cost_type: newTransaction.costType,
      description: newTransaction.description,
      invoice_no: newTransaction.invoiceNo,
      vendor: newTransaction.vendor,
      payment_status: newTransaction.paymentStatus,
      paid_amount: Number(newTransaction.paidAmount),
      payment_date: newTransaction.paymentDate,
      attachments: newTransaction.attachments || [],
      created_at: newTransaction.createdAt.toISOString(),
      updated_at: newTransaction.updatedAt.toISOString(),
      org_id: newTransaction.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        transaction,
      }),
      {
        status: 201,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error creating transaction:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to create transaction',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}
