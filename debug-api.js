#!/usr/bin/env node

/**
 * Debug script for API issues
 */

const http = require('http');

async function testAPI() {
  console.log('🔍 Debugging /api/v1/projects...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/projects?limit=1',
    method: 'GET',
    headers: {
      'x-e2e-bypass': 'true',
      'x-org-id': 'org_sample_123',
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Headers:', res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\nResponse body:');
        console.log(data);
        
        try {
          const parsed = JSON.parse(data);
          console.log('\nParsed JSON:');
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Failed to parse JSON:', e.message);
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
      reject(err);
    });

    req.end();
  });
}

testAPI().catch(console.error);
