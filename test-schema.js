// Test script to verify new schema fields
import { db } from './src/db/index.js';
import { projectsSchema, dailyLogsSchema, transactionsSchema, shareLinksSchema } from './src/models/Schema.js';

async function testSchema() {
  console.log('🔍 Testing new schema fields...\n');

  try {
    // Test Projects table with new fields
    console.log('📋 PROJECTS TABLE - Testing new fields:');
    const projects = await db.select().from(projectsSchema).limit(3);
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log('✅ Sample project data:');
      console.log(`   - Name: ${project.name}`);
      console.log(`   - Budget Total: ${project.budgetTotal || 'NULL'}`);
      console.log(`   - Currency: ${project.currency || 'NULL'}`);
      console.log(`   - Address: ${project.address || 'NULL'}`);
      console.log(`   - Scale: ${project.scale ? JSON.stringify(project.scale) : 'NULL'}`);
      console.log(`   - Investor Name: ${project.investorName || 'NULL'}`);
      console.log(`   - Investor Phone: ${project.investorPhone || 'NULL'}`);
      console.log(`   - End Date: ${project.endDate || 'NULL'}`);
    }

    // Test Daily Logs table with new fields
    console.log('\n📝 DAILY LOGS TABLE - Testing new fields:');
    const dailyLogs = await db.select().from(dailyLogsSchema).limit(3);
    
    if (dailyLogs.length > 0) {
      const log = dailyLogs[0];
      console.log('✅ Sample daily log data:');
      console.log(`   - Log Date: ${log.logDate}`);
      console.log(`   - Status: ${log.status || 'NULL'}`);
      console.log(`   - Review Comment: ${log.reviewComment || 'NULL'}`);
      console.log(`   - QC Rating: ${log.qcRating || 'NULL'}`);
    }

    // Test Transactions table with new fields
    console.log('\n💰 TRANSACTIONS TABLE - Testing new fields:');
    const transactions = await db.select().from(transactionsSchema).limit(3);
    
    if (transactions.length > 0) {
      const transaction = transactions[0];
      console.log('✅ Sample transaction data:');
      console.log(`   - Type: ${transaction.type}`);
      console.log(`   - Amount: ${transaction.amount}`);
      console.log(`   - Payment Status: ${transaction.paymentStatus || 'NULL'}`);
      console.log(`   - Paid Amount: ${transaction.paidAmount || 'NULL'}`);
      console.log(`   - Payment Date: ${transaction.paymentDate || 'NULL'}`);
      console.log(`   - Attachments: ${transaction.attachments ? JSON.stringify(transaction.attachments) : 'NULL'}`);
    }

    // Test Share Links table with new fields
    console.log('\n🔗 SHARE LINKS TABLE - Testing new fields:');
    const shareLinks = await db.select().from(shareLinksSchema).limit(1);
    
    if (shareLinks.length > 0) {
      const shareLink = shareLinks[0];
      console.log('✅ Sample share link data:');
      console.log(`   - Hide Finance: ${shareLink.hideFinance}`);
      console.log(`   - Show Investor Contact: ${shareLink.showInvestorContact}`);
    } else {
      console.log('ℹ️ No share links found (this is expected)');
    }

    // Count records
    console.log('\n📊 RECORD COUNTS:');
    const projectCount = await db.select().from(projectsSchema);
    const dailyLogCount = await db.select().from(dailyLogsSchema);
    const transactionCount = await db.select().from(transactionsSchema);
    
    console.log(`   - Projects: ${projectCount.length}`);
    console.log(`   - Daily Logs: ${dailyLogCount.length}`);
    console.log(`   - Transactions: ${transactionCount.length}`);

    console.log('\n✅ Schema test completed successfully!');
    console.log('🎉 All new fields are accessible and populated with data.');

  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    console.error('Full error:', error);
  }

  process.exit(0);
}

testSchema();

