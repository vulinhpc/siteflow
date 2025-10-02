#!/usr/bin/env node

/**
 * Test script for /api/v1/projects endpoint
 * Tests the canonical implementation with filters, pagination, computed fields
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_PATH = '/api/v1/projects';

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-e2e-bypass': 'true',
        'x-org-id': 'org_sample_123',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test cases
async function runTests() {
  console.log('🚀 Testing /api/v1/projects endpoint...\n');

  try {
    // Test 1: Basic GET request
    console.log('📋 Test 1: Basic GET /api/v1/projects');
    const basicResponse = await makeRequest(API_PATH);
    console.log(`Status: ${basicResponse.status}`);
    
    if (basicResponse.status === 200) {
      console.log('✅ Basic request successful');
      console.log(`Items returned: ${basicResponse.data.items?.length || 0}`);
      console.log(`Has nextCursor: ${!!basicResponse.data.nextCursor}`);
      
      // Check response structure
      if (basicResponse.data.items && basicResponse.data.items.length > 0) {
        const firstItem = basicResponse.data.items[0];
        console.log('📊 First item structure:');
        console.log(`- ID: ${firstItem.id}`);
        console.log(`- Name: ${firstItem.name}`);
        console.log(`- Status: ${firstItem.status}`);
        console.log(`- Progress: ${firstItem.progress_pct}%`);
        console.log(`- Budget Total: ${firstItem.budget_total}`);
        console.log(`- Budget Used: ${firstItem.budget_used}`);
        console.log(`- Manager: ${firstItem.manager?.name || 'None'}`);
        console.log(`- Thumbnail: ${firstItem.thumbnail_url || 'None'}`);
      }
    } else {
      console.log('❌ Basic request failed');
      console.log('Response:', basicResponse.data);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Search filter
    console.log('📋 Test 2: Search filter (?q=test)');
    const searchResponse = await makeRequest(API_PATH + '?q=test');
    console.log(`Status: ${searchResponse.status}`);
    
    if (searchResponse.status === 200) {
      console.log('✅ Search request successful');
      console.log(`Items returned: ${searchResponse.data.items?.length || 0}`);
    } else {
      console.log('❌ Search request failed');
      console.log('Response:', searchResponse.data);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Status filter
    console.log('📋 Test 3: Status filter (?status=in_progress)');
    const statusResponse = await makeRequest(API_PATH + '?status=in_progress');
    console.log(`Status: ${statusResponse.status}`);
    
    if (statusResponse.status === 200) {
      console.log('✅ Status filter successful');
      console.log(`Items returned: ${statusResponse.data.items?.length || 0}`);
      
      // Verify all items have correct status
      if (statusResponse.data.items) {
        const allCorrectStatus = statusResponse.data.items.every(item => item.status === 'in_progress');
        console.log(`All items have correct status: ${allCorrectStatus ? '✅' : '❌'}`);
      }
    } else {
      console.log('❌ Status filter failed');
      console.log('Response:', statusResponse.data);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 4: Pagination
    console.log('📋 Test 4: Pagination (?limit=5)');
    const paginationResponse = await makeRequest(API_PATH + '?limit=5');
    console.log(`Status: ${paginationResponse.status}`);
    
    if (paginationResponse.status === 200) {
      console.log('✅ Pagination successful');
      console.log(`Items returned: ${paginationResponse.data.items?.length || 0}`);
      console.log(`Has nextCursor: ${!!paginationResponse.data.nextCursor}`);
      
      // Test cursor-based pagination if nextCursor exists
      if (paginationResponse.data.nextCursor) {
        console.log('\n📋 Test 4b: Cursor-based pagination');
        const cursorResponse = await makeRequest(API_PATH + `?limit=5&cursor=${paginationResponse.data.nextCursor}`);
        console.log(`Cursor page status: ${cursorResponse.status}`);
        console.log(`Cursor page items: ${cursorResponse.data.items?.length || 0}`);
      }
    } else {
      console.log('❌ Pagination failed');
      console.log('Response:', paginationResponse.data);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 5: Invalid parameters
    console.log('📋 Test 5: Invalid parameters (?limit=invalid)');
    const invalidResponse = await makeRequest(API_PATH + '?limit=invalid');
    console.log(`Status: ${invalidResponse.status}`);
    
    if (invalidResponse.status === 400) {
      console.log('✅ Invalid parameters correctly rejected');
      console.log('Error type:', invalidResponse.data.type);
    } else {
      console.log('❌ Invalid parameters not handled correctly');
      console.log('Response:', invalidResponse.data);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 6: Sort options
    console.log('📋 Test 6: Sort by name (?sort=name&order=asc)');
    const sortResponse = await makeRequest(API_PATH + '?sort=name&order=asc&limit=3');
    console.log(`Status: ${sortResponse.status}`);
    
    if (sortResponse.status === 200) {
      console.log('✅ Sort successful');
      console.log(`Items returned: ${sortResponse.data.items?.length || 0}`);
      
      if (sortResponse.data.items && sortResponse.data.items.length > 1) {
        const names = sortResponse.data.items.map(item => item.name);
        console.log('Project names (should be sorted):', names);
      }
    } else {
      console.log('❌ Sort failed');
      console.log('Response:', sortResponse.data);
    }

    console.log('\n' + '🎉 All tests completed!\n');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);