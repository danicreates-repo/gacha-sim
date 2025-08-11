import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';

const API_URL = process.env.REACT_APP_API_URL;

const determineRarity = (rate) => {
  if (rate >= 0.01) return 'Common';
  else if (rate >= 0.005) return 'Uncommon';
  else if (rate >= 0.0015) return 'Rare';
  else return 'Jackpot';
};

const rewardSets = {
  wanderBox: {
    rates: `0.13%       Lady of Midnight's Cold Wings
...   ...
1.55%   Homestead Golden Sprout (x5)`,
    costs: {
      1: 1.5,
      11: 15,
      45: 57.5
    },
    batches: [1, 11, 45]
  },
  midnightLantern: {
    rates: `0.11%       Special Midnight Covenant Cape (Enchantable)
...   ...
1.51%   Alban Knights Training Stone [Difficulty: Advanced]`,
    costs: {
      1: 1.5,
      11: 15,
      45: 57.5
    },
    batches: [1, 11, 45]
  }
};

const GachaSimulator = () => {
  const [selectedSet, setSelectedSet] = useState('wanderBox');
  const [prizeInput, setPrizeInput] = useState(rewardSets.wanderBox.rates);
  const [costs, setCosts] = useState(rewardSets.wanderBox.costs);
  const [batches, setBatches] = useState(rewardSets.wanderBox.batches);
  const [rewards, setRewards] = useState([]);
  const [awardedItems, setAwardedItems] = useState({});
  const [totalDraws, setTotalDraws] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [filter, setFilter] = useState('');
  const [visitorCount, setVisitorCount] = useState(0);
  const [globalSpent, setGlobalSpent] = useState(0);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      setVisitorCount(data.visitors);
      setGlobalSpent(data.totalSpent);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    const initVisitor = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'visitor' }),
        });
        const data = await response.json();
        setVisitorCount(data.visitors);
        setGlobalSpent(data.totalSpent);
      } catch (error) {
        console.error('Failed to increment visitor:', error);
      }
    };
    initVisitor();
  }, []);

  useEffect(() => {
    parseRewards();
  }, [prizeInput]);

  useEffect(() => {
    setPrizeInput(rewardSets[selectedSet].rates);
    setCosts(rewardSets[selectedSet].costs);
    setBatches(rewardSets[selectedSet].batches);
  }, [selectedSet]);

  const parseRewards = () => {
    const parsedRewards = prizeInput.split('\n').map(line => {
      const parts = line.split(/\t|(?<=\%)\s+/);
      const rateStr = parts[0].trim();
      const item = parts[1].trim();
      const rate = parseFloat(rateStr.replace('%', '').trim()) / 100;
      return { item, rate };
    });
    setRewards(parsedRewards);
  };

  const drawItems = async (drawCount) => {
    const newAwardedItems = { ...awardedItems };
    for (let i = 0; i < drawCount; i++) {
      const random_number = Math.random();
      let cumulativeRate = 0;
      for (const reward of rewards) {
        cumulativeRate += reward.rate;
        if (random_number < cumulativeRate) {
          if (reward.item in newAwardedItems) {
            newAwardedItems[reward.item].count++;
          } else {
            newAwardedItems[reward.item] = {
              count: 1,
              rarity: determineRarity(reward.rate)
            };
          }
          break;
        }
      }
    }
    setAwardedItems(newAwardedItems);
    setTotalDraws(prevTotalDraws => prevTotalDraws + drawCount);

    const batchCost = costs[drawCount] || (1.5 * drawCount);
    setTotalCost(prevTotalCost => prevTotalCost + batchCost);
    
    try {
      const response = await fetch(`${API_URL}/api/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'spent',
          amount: batchCost 
        }),
      });
      const data = await response.json();
      setGlobalSpent(data.totalSpent);
    } catch (error) {
      console.error('Failed to update total spent:', error);
    }
  };

  const filteredItems = Object.entries(awardedItems)
    .filter(([item, data]) => filter === '' || data.rarity === filter)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="p-4 bg-background text-foreground min-h-screen">
      <Card className="mb-4">
        <CardHeader>Dani's Gacha Sim</CardHeader>
        <CardContent>
          <h2 className="mb-2">
            <a
              href="https://repo.danii.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Repo of my dumb projects
            </a>
          </h2>
          <h4 className="mb-2">To change the rates/items, copy from the RNG rates table that is linked in every gacha</h4>
          <h4 className="mb-2">Copy only the %s and the names, leave the headers out.</h4>
          <Textarea
            value={prizeInput}
            onChange={(e) => setPrizeInput(e.target.value)}
            className="w-full mb-4"
          />
          <div className="mb-4">
            {batches.map(batchSize => (
              <Button key={batchSize} onClick={() => drawItems(batchSize)} className="mr-2">
                Draw {batchSize}
              </Button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div>Total Visitors: {visitorCount}</div>
            <div>Your Draws: {totalDraws} (${totalCost.toFixed(2)})</div>
            <div>Global Amount Spent: ${globalSpent.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Choose Reward Set</CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={() => setSelectedSet('wanderBox')} className="mr-2">Worldwide Wanderer Box</Button>
            <Button onClick={() => setSelectedSet('midnightLantern')} className="mr-2">Midnight Covenant Loot-o-Lantern</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Results</CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={() => setFilter('')} className="mr-2">All</Button>
            <Button onClick={() => setFilter('Common')} className="mr-2">Common</Button>
            <Button onClick={() => setFilter('Uncommon')} className="mr-2">Uncommon</Button>
            <Button onClick={() => setFilter('Rare')} className="mr-2">Rare</Button>
            <Button onClick={() => setFilter('Jackpot')}>Jackpot</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prize</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Rarity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(([item, data]) => (
                <TableRow key={item}>
                  <TableCell>{item}</TableCell>
                  <TableCell>{data.count}</TableCell>
                  <TableCell>{data.rarity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GachaSimulator;
