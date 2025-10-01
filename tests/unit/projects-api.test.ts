import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import the API route handler
import { GET, POST } from '@/app/api/v1/projects/route';

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
};

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => args),
  count: vi.fn(() => 'count'),
  desc: vi.fn(field => ({ field, direction: 'desc' })),
  eq: vi.fn((field, value) => ({ field, value, operator: 'eq' })),
  isNull: vi.fn(field => ({ field, operator: 'isNull' })),
}));

// Mock database connection
vi.mock('@/db', () => ({
  db: mockDb,
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

describe('Projects API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/v1/projects', () => {
    it('should return projects list with pagination', async () => {
      // Mock database response
      const mockProjects = [
        {
          id: '1',
          name: 'Test Project 1',
          status: 'PLANNING',
          budget: '1000000.00',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Test Project 2',
          status: 'IN_PROGRESS',
          budget: '2000000.00',
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockDb.select.mockResolvedValueOnce([{ count: 2 }]); // Total count
      mockDb.select.mockResolvedValueOnce(mockProjects); // Projects list

      const request = new NextRequest('http://localhost:3000/api/v1/projects?page=1&limit=10', {
        headers: {
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('totalPages');
      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should return empty list when no projects', async () => {
      mockDb.select.mockResolvedValueOnce([{ count: 0 }]);
      mockDb.select.mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        headers: {
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it('should return 400 when orgId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
      expect(data.detail).toContain('Organization ID is required');
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create project successfully', async () => {
      const mockProject = {
        id: 'new-project-id',
        name: 'New Test Project',
        status: 'PLANNING',
        budget: '1000000.00',
        createdAt: new Date(),
      };

      mockDb.insert.mockReturnThis();
      mockDb.values.mockReturnThis();
      mockDb.returning.mockResolvedValueOnce([mockProject]);

      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: 'New Test Project',
          status: 'PLANNING',
          budget: '1000000',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(data.project).toHaveProperty('id');
      expect(data.project.name).toBe('New Test Project');
    });

    it('should return 400 for invalid payload', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: 'A', // Too short
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
      expect(data.detail).toContain('Project name must be at least 3 characters');
    });

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: 'Test Project',
          status: 'PLANNING',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.type).toContain('database-error');
    });
  });

  describe('Soft Delete', () => {
    it('should not return soft-deleted projects', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Active Project',
          deletedAt: null,
        },
        {
          id: '2',
          name: 'Deleted Project',
          deletedAt: new Date(),
        },
      ];

      mockDb.select.mockResolvedValueOnce([{ count: 1 }]); // Only active projects
      mockDb.select.mockResolvedValueOnce([mockProjects[0]]); // Only active project

      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        headers: {
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe('Active Project');
    });
  });
});
