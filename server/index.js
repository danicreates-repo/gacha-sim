const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: 'https://gacha.danii.io',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB setup
const uri = process.env.MONGODB_URI;
let client = null;
let db = null;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('gachaSimulator');
  }
  return db;
}

// Routes
app.get('/api/stats', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const visitors = await db.collection('stats').findOne({ type: 'visitors' });
    const totalSpent = await db.collection('stats').findOne({ type: 'totalSpent' });
    
    res.json({
      visitors: visitors ? visitors.count : 0,
      totalSpent: totalSpent ? totalSpent.amount : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/stats', async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    if (req.body.type === 'visitor') {
      await db.collection('stats').updateOne(
        { type: 'visitors' },
        { $inc: { count: 1 } },
        { upsert: true }
      );
    } else if (req.body.type === 'spent') {
      await db.collection('stats').updateOne(
        { type: 'totalSpent' },
        { $inc: { amount: req.body.amount } },
        { upsert: true }
      );
    }
    
    const visitors = await db.collection('stats').findOne({ type: 'visitors' });
    const totalSpent = await db.collection('stats').findOne({ type: 'totalSpent' });
    
    res.json({
      visitors: visitors ? visitors.count : 0,
      totalSpent: totalSpent ? totalSpent.amount : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
