import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import the API route handler
import { GET, POST } from '@/app/api/v1/projects/route';

// Mock database with proper chaining
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
  lt: vi.fn((field, value) => ({ field, value, operator: 'lt' })),
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

describe('Projects API Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/v1/projects - Create Project', () => {
    it('should create project successfully with required fields only', async () => {
      const mockProject = {
        id: 'new-project-id',
        name: 'Test Project',
        status: 'PLANNING',
        orgId: 'org_e2e_default',
        createdAt: new Date(),
        updatedAt: new Date(),
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
          name: 'Test Project',
          status: 'PLANNING',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(data.project).toHaveProperty('id');
      expect(data.project.name).toBe('Test Project');
      expect(data.project.status).toBe('PLANNING');
    });

    it('should create project with all optional fields', async () => {
      const mockProject = {
        id: 'complete-project-id',
        name: 'Complete Test Project',
        status: 'IN_PROGRESS',
        description: 'This is a comprehensive test project',
        endDate: new Date('2024-12-31'),
        thumbnailUrl: 'https://picsum.photos/400/300?random=1',
        orgId: 'org_e2e_default',
        createdAt: new Date(),
        updatedAt: new Date(),
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
          name: 'Complete Test Project',
          status: 'IN_PROGRESS',
          description: 'This is a comprehensive test project',
          endDate: '2024-12-31',
          thumbnailUrl: 'https://picsum.photos/400/300?random=1',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ok).toBe(true);
      expect(data.project.name).toBe('Complete Test Project');
      expect(data.project.status).toBe('IN_PROGRESS');
      expect(data.project.description).toBe(
        'This is a comprehensive test project',
      );
      expect(data.project.thumbnailUrl).toBe(
        'https://picsum.photos/400/300?random=1',
      );
    });

    it('should return 400 for missing required name field', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          status: 'PLANNING',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
      expect(data.detail).toContain('Project name is required');
    });

    it('should return 400 for missing required status field', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: 'Test Project',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
      expect(data.detail).toContain('Project status is required');
    });

    it('should return 400 for invalid status enum value', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: 'Test Project',
          status: 'INVALID_STATUS',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
    });

    it('should return 400 for name too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: 'A', // Too short
          status: 'PLANNING',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
      expect(data.detail).toContain(
        'Project name must be at least 3 characters',
      );
    });

    it('should return 400 for name too long', async () => {
      const longName = 'A'.repeat(256); // Too long
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: longName,
          status: 'PLANNING',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
      expect(data.detail).toContain(
        'Project name must be at most 255 characters',
      );
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
      expect(data.detail).toContain('Failed to create project');
    });
  });

  describe('GET /api/v1/projects - List Projects', () => {
    it('should return projects list with pagination', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Test Project 1',
          status: 'PLANNING',
          description: 'Test description 1',
          thumbnailUrl: 'https://picsum.photos/400/300?random=1',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Test Project 2',
          status: 'IN_PROGRESS',
          description: 'Test description 2',
          thumbnailUrl: 'https://picsum.photos/400/300?random=2',
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockDb.select.mockResolvedValueOnce([{ count: 2 }]); // Total count
      mockDb.select.mockResolvedValueOnce(mockProjects); // Projects list

      const request = new NextRequest(
        'http://localhost:3000/api/v1/projects?page=1&limit=10',
        {
          headers: {
            'x-e2e-bypass': '1',
            'x-org-id': 'org_e2e_default',
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('totalPages');
      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.items[0].name).toBe('Test Project 1');
      expect(data.items[1].name).toBe('Test Project 2');
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

  // Note: DELETE functionality not implemented in current API

  describe('Project Status Enum Validation', () => {
    it('should accept all valid status values', async () => {
      const validStatuses = [
        'PLANNING',
        'IN_PROGRESS',
        'DONE',
        'ON_HOLD',
        'CANCELLED',
      ];

      for (const status of validStatuses) {
        const mockProject = {
          id: `project-${status.toLowerCase()}`,
          name: `Test Project ${status}`,
          status,
          orgId: 'org_e2e_default',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockDb.insert.mockReturnThis();
        mockDb.values.mockReturnThis();
        mockDb.returning.mockResolvedValueOnce([mockProject]);

        const request = new NextRequest(
          'http://localhost:3000/api/v1/projects',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-e2e-bypass': '1',
              'x-org-id': 'org_e2e_default',
            },
            body: JSON.stringify({
              name: `Test Project ${status}`,
              status,
            }),
          },
        );

        const response = await POST(request);

        expect(response.status).toBe(201);
      }
    });
  });

  describe('Date Validation', () => {
    it('should accept valid date format for endDate', async () => {
      const mockProject = {
        id: 'date-test-project',
        name: 'Date Test Project',
        status: 'PLANNING',
        endDate: new Date('2024-12-31'),
        orgId: 'org_e2e_default',
        createdAt: new Date(),
        updatedAt: new Date(),
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
          name: 'Date Test Project',
          status: 'PLANNING',
          endDate: '2024-12-31',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.project.endDate).toBeDefined();
    });

    it('should handle invalid date format gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1',
          'x-org-id': 'org_e2e_default',
        },
        body: JSON.stringify({
          name: 'Invalid Date Project',
          status: 'PLANNING',
          endDate: 'invalid-date',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.type).toContain('validation-error');
    });
  });
});
