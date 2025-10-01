// Test script for refactored project API
const testCreateProject = async () => {
  try {
    console.log('🧪 Testing Create Project API with new schema...');

    const testData = {
      name: 'Test Project Refactor',
      description: 'Testing the new project schema with members array',
      status: 'PLANNING',
      startDate: '2024-01-15',
      endDate: '2024-06-15',
      members: [
        {
          userId: 'user_sample_123',
          role: 'manager',
        },
        {
          userId: 'user_sample_456',
          role: 'engineer',
        },
        {
          userId: 'user_sample_789',
          role: 'accountant',
        },
      ],
      thumbnailUrl: 'https://example.com/test-image.jpg',
    };

    const response = await fetch('http://localhost:3000/api/v1/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-e2e-bypass': 'true',
        'x-org-id': 'org_sample_123',
        'x-user-id': 'user_sample_123',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Project created successfully!');
      console.log('Project ID:', result.project.id);
      console.log('Project Name:', result.project.name);
      console.log('Start Date:', result.project.startDate);
      console.log('Members assigned:', testData.members.length);
    } else {
      console.error('❌ Failed to create project:', result);
    }
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

const testGetMembers = async () => {
  try {
    console.log('🧪 Testing Get Organization Members API...');

    const response = await fetch('http://localhost:3000/api/v1/clerk-members', {
      method: 'GET',
      headers: {
        'x-e2e-bypass': 'true',
        'x-org-id': 'org_sample_123',
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Members fetched successfully!');
      console.log('Total members:', result.totalCount);
      console.log('Members:', result.members.map(m => `${m.displayName || m.name} (${m.role})`));
    } else {
      console.error('❌ Failed to fetch members:', result);
    }
  } catch (error) {
    console.error('❌ Error testing members API:', error);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting API tests...\n');

  await testGetMembers();
  console.log('');
  await testCreateProject();

  console.log('\n✨ Tests completed!');
};

runTests();
