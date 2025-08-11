const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function viewStats() {
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
    
    // Get all stats in one query
    const stats = await db.collection('stats').find({
      type: { $in: ['visitors', 'totalSpent'] }
    }).toArray();

    // Process the results
    const visitors = stats.find(s => s.type === 'visitors')?.count || 0;
    const spent = stats.find(s => s.type === 'totalSpent')?.amount || 0;

    console.log('\nGacha Simulator Statistics:');
    console.log('------------------------');
    console.log(`Total Visitors: ${visitors}`);
    console.log(`Total Amount Spent: $${spent.toFixed(2)}`);
    console.log('------------------------\n');

  } catch (error) {
    console.error('Error fetching stats:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function if this script is run directly
if (require.main === module) {
  viewStats().catch(console.error);
}
