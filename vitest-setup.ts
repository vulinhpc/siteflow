import { vi } from 'vitest';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: RequestInit) {}
    headers = new Map();
    json = vi.fn();
  },
  NextResponse: {
    json: vi.fn((data, init) => ({ data, ...init })),
  },
}));

// Mock database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  count: vi.fn(() => 'count'),
  desc: vi.fn(field => ({ field, direction: 'desc' })),
  eq: vi.fn((field, value) => ({ field, value, operator: 'eq' })),
  isNull: vi.fn(field => ({ field, operator: 'isNull' })),
}));

// Mock schema
vi.mock('@/models/Schema', () => ({
  projectsSchema: {
    id: 'id',
    orgId: 'orgId',
    name: 'name',
    description: 'description',
    status: 'status',
    budget: 'budget',
    startDate: 'startDate',
    endDate: 'endDate',
    address: 'address',
    clientName: 'clientName',
    clientContact: 'clientContact',
    thumbnailUrl: 'thumbnailUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
  },
}));
