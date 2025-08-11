const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function modifyVisitors(adjustment) {
  // Validate input
  const changeAmount = parseInt(adjustment);
  if (isNaN(changeAmount)) {
    console.error('Please provide a valid number for visitor adjustment');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  
  // Check if URI is available
  if (!uri) {
    console.error('Error: MONGODB_URI not found in environment variables');
    console.error('Make sure you have a .env file in the server directory with MONGODB_URI=mongodb://localhost:27017/gachaSimulator');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('gachaSimulator');
    
    // Get current count before modification
    const beforeStats = await db.collection('stats').findOne({ type: 'visitors' });
    const beforeCount = beforeStats?.count || 0;

    // Update visitor count
    await db.collection('stats').updateOne(
      { type: 'visitors' },
      { 
        $inc: { count: changeAmount },
        $setOnInsert: { type: 'visitors' }
      },
      { upsert: true }
    );

    // Get new count after modification
    const afterStats = await db.collection('stats').findOne({ type: 'visitors' });
    const afterCount = afterStats?.count || 0;

    console.log('\nVisitor Count Modification:');
    console.log('-------------------------');
    console.log(`Previous Count: ${beforeCount}`);
    console.log(`Adjustment: ${changeAmount > 0 ? '+' : ''}${changeAmount}`);
    console.log(`New Count: ${afterCount}`);
    console.log('-------------------------\n');

  } catch (error) {
    console.error('Error modifying visitor count:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Check if running directly and get adjustment from command line argument
if (require.main === module) {
  const adjustment = process.argv[2];
  if (!adjustment) {
    console.error('Please provide a number to adjust the visitor count.');
    console.log('Usage: node modifyVisitors.js <number>');
    console.log('Example: node modifyVisitors.js -5  // Decreases visitor count by 5');
    console.log('Example: node modifyVisitors.js 10  // Increases visitor count by 10');
    process.exit(1);
  }
  modifyVisitors(adjustment).catch(console.error);
}
