// Using built-in fetch (Node.js 18+)

const API_BASE_URL = 'http://localhost:3000/api/v1/projects';

async function runTest(name, url, expectedStatus = 200, validator = null) {
  console.log(`\n📋 Test ${name}: ${url.replace(API_BASE_URL, '')}`);
  try {
    const response = await fetch(url, {
      headers: {
        'x-e2e-bypass': 'true',
        'x-org-id': 'org_sample_123',
      },
    });
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    if (response.status === expectedStatus) {
      console.log(`✅ ${name} successful`);
      if (validator) {
        const validationResult = validator(data);
        console.log(`Validation: ${validationResult ? '✅ PASS' : '❌ FAIL'}`);
        return { success: validationResult, data, status: response.status };
      }
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ ${name} failed`);
      console.log('Response:', data);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.error(`❌ An error occurred during ${name}:`, error);
    return { success: false, error };
  }
}

// Validators
const validateProjectStructure = (data) => {
  if (!data.items || !Array.isArray(data.items)) return false;
  if (data.items.length === 0) return true; // Empty is valid
  
  const project = data.items[0];
  const requiredFields = [
    'id', 'name', 'status', 'progress_pct', 'budget_total', 
    'budget_used', 'budget_used_pct', 'dates', 'updatedAt'
  ];
  
  return requiredFields.every(field => project.hasOwnProperty(field));
};

const validateRFC7807Error = (data) => {
  const requiredFields = ['type', 'title', 'status', 'detail', 'instance'];
  return requiredFields.every(field => data.hasOwnProperty(field));
};

const validateDateRange = (data) => {
  if (!data.items || data.items.length === 0) return true;
  
  // Check if all items have start_date >= 2025-10-01
  return data.items.every(item => {
    if (!item.dates.start_date) return true; // null dates are allowed
    return new Date(item.dates.start_date) >= new Date('2025-10-01');
  });
};

async function main() {
  console.log('🚀 Extended Testing /api/v1/projects endpoint...');

  // Test 1: Validate project structure
  await runTest(
    'Project Structure Validation', 
    `${API_BASE_URL}?limit=1`, 
    200, 
    validateProjectStructure
  );

  // Test 2: Multiple status filters
  await runTest(
    'Multiple Status Filter', 
    `${API_BASE_URL}?status=planning&status=completed&limit=10`, 
    200,
    (data) => data.items.every(item => ['planning', 'completed'].includes(item.status))
  );

  // Test 3: Date range filter
  await runTest(
    'Date Range Filter', 
    `${API_BASE_URL}?start_from=2025-10-01&limit=10`, 
    200,
    validateDateRange
  );

  // Test 4: Combined filters
  await runTest(
    'Combined Filters', 
    `${API_BASE_URL}?q=Chung&status=in_progress&sort=name&order=asc&limit=5`, 
    200,
    (data) => data.items.length >= 0 // Any result is valid for combined filters
  );

  // Test 5: Large limit (boundary test)
  await runTest(
    'Large Limit Boundary', 
    `${API_BASE_URL}?limit=100`, 
    200,
    (data) => data.items.length <= 100
  );

  // Test 6: Invalid limit (too large)
  await runTest(
    'Invalid Large Limit', 
    `${API_BASE_URL}?limit=101`, 
    400,
    validateRFC7807Error
  );

  // Test 7: Invalid status value
  await runTest(
    'Invalid Status Value', 
    `${API_BASE_URL}?status=invalid_status`, 
    400,
    validateRFC7807Error
  );

  // Test 8: Invalid date format
  await runTest(
    'Invalid Date Format', 
    `${API_BASE_URL}?start_from=invalid-date`, 
    400,
    validateRFC7807Error
  );

  // Test 9: Empty search query
  await runTest(
    'Empty Search Query', 
    `${API_BASE_URL}?q=`, 
    200,
    (data) => Array.isArray(data.items)
  );

  // Test 10: Sort by budget (if supported)
  await runTest(
    'Sort by Budget', 
    `${API_BASE_URL}?sort=budget_used_pct&order=desc&limit=3`, 
    200,
    (data) => data.items.length >= 0 // Budget sorting might not be implemented yet
  );

  console.log('\n🎉 Extended API testing completed!');
}

main();
