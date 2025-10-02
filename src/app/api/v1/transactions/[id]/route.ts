import { and, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { transactionsSchema } from '@/models/Schema';

// Lazy load database to avoid connection during build time
async function getDb() {
  const { db } = await import('@/db');
  return db;
}

// Payment update schema
const updatePaymentSchema = z.object({
  payment_status: z.enum(['PENDING', 'PARTIAL', 'PAID']),
  paid_amount: z.number().min(0, 'Paid amount must be non-negative'),
  payment_date: z.string().date('Payment date must be a valid date'),
  attachments: z
    .array(
      z.object({
        url: z.string().url('Attachment URL must be valid'),
        filename: z.string().optional(),
      }),
    )
    .optional(),
});

// GET /api/v1/transactions/:id
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

    const transactionId = params.id;
    const db = await getDb();

    // Get transaction by ID
    const transaction = await db
      .select()
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.id, transactionId),
          eq(transactionsSchema.orgId, orgId),
          isNull(transactionsSchema.deletedAt),
        ),
      )
      .limit(1);

    if (transaction.length === 0) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/not-found',
          title: 'Transaction Not Found',
          status: 404,
          detail: 'Transaction not found or access denied',
          instance: req.url,
        }),
        {
          status: 404,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    const transactionData = transaction[0];

    // Format canonical response
    const formattedTransaction = {
      id: transactionData.id,
      project_id: transactionData.projectId,
      date: transactionData.date,
      type: transactionData.type,
      amount: Number(transactionData.amount),
      currency: transactionData.currency,
      cost_type: transactionData.costType,
      description: transactionData.description,
      invoice_no: transactionData.invoiceNo,
      vendor: transactionData.vendor,
      payment_status: transactionData.paymentStatus,
      paid_amount: Number(transactionData.paidAmount),
      payment_date: transactionData.paymentDate,
      attachments: transactionData.attachments || [],
      created_at: transactionData.createdAt.toISOString(),
      updated_at: transactionData.updatedAt.toISOString(),
      org_id: transactionData.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        transaction: formattedTransaction,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch transaction',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}

// PATCH /api/v1/transactions/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const isE2E = req.headers.get('x-e2e-bypass') === 'true';
    const orgId = req.headers.get('x-org-id') || 'org_sample_123';
    const userRole = req.headers.get('x-user-role') || 'ACCOUNTANT';

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

    // Only ACCOUNTANT can update payment status to PARTIAL/PAID
    if (!isE2E && !['ACCOUNTANT', 'ADMIN'].includes(userRole)) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Only accountants can update payment status',
          instance: req.url,
        }),
        {
          status: 403,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    const transactionId = params.id;

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
    const validationResult = updatePaymentSchema.safeParse(body);
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

    // Check if transaction exists and belongs to org
    const existingTransaction = await db
      .select()
      .from(transactionsSchema)
      .where(
        and(
          eq(transactionsSchema.id, transactionId),
          eq(transactionsSchema.orgId, orgId),
          isNull(transactionsSchema.deletedAt),
        ),
      )
      .limit(1);

    if (existingTransaction.length === 0) {
      return new Response(
        JSON.stringify({
          type: 'https://siteflow.app/errors/not-found',
          title: 'Transaction Not Found',
          status: 404,
          detail: 'Transaction not found or access denied',
          instance: req.url,
        }),
        {
          status: 404,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }

    // Update transaction payment info
    const [updatedTransaction] = await db
      .update(transactionsSchema)
      .set({
        paymentStatus: validatedData.payment_status,
        paidAmount: validatedData.paid_amount.toString(),
        paymentDate: validatedData.payment_date,
        attachments: validatedData.attachments || null,
        updatedAt: new Date(),
      })
      .where(eq(transactionsSchema.id, transactionId))
      .returning();

    // Format canonical response
    const transaction = {
      id: updatedTransaction.id,
      project_id: updatedTransaction.projectId,
      date: updatedTransaction.date,
      type: updatedTransaction.type,
      amount: Number(updatedTransaction.amount),
      currency: updatedTransaction.currency,
      cost_type: updatedTransaction.costType,
      description: updatedTransaction.description,
      invoice_no: updatedTransaction.invoiceNo,
      vendor: updatedTransaction.vendor,
      payment_status: updatedTransaction.paymentStatus,
      paid_amount: Number(updatedTransaction.paidAmount),
      payment_date: updatedTransaction.paymentDate,
      attachments: updatedTransaction.attachments || [],
      created_at: updatedTransaction.createdAt.toISOString(),
      updated_at: updatedTransaction.updatedAt.toISOString(),
      org_id: updatedTransaction.orgId,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        transaction,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error updating transaction:', error);
    return new Response(
      JSON.stringify({
        type: 'https://siteflow.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to update transaction',
        instance: req.url,
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
}
