// GachaSimulator.js
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import CircleGraph from '../components/ui/CircleGraph';

const API_URL = process.env.REACT_APP_API_URL;

// Create contexts so that Webpack includes our .txt and image assets.
// Note: For text files, require returns a URL; we will fetch the content using that URL.
const txtContext = require.context('../boxes', true, /\.txt$/);
const imgContext = require.context('../boxes', true, /\.(jpg|jpeg|png)$/);
// Add context for old boxes
const oldTxtContext = require.context('../old_boxes', true, /\.txt$/);
const oldImgContext = require.context('../old_boxes', true, /\.(jpg|jpeg|png)$/);

// Helper function to retrieve an asset using the provided context and key.
// The key format is "./<boxId>/<fileName>" as stored by Webpack.
const getAssetFromContext = (context, boxId, fileName, isOldBox = false) => {
  const key = `./${boxId}/${fileName}`;
  try {
    return context(key);
  } catch (error) {
    console.warn(`Could not load asset at ${key}`, error);
    return null;
  }
};

// Helper function to fetch text content from a given URL.
const fetchTextAsset = async (url) => {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.warn(`Could not fetch text from ${url}`, error);
    return '';
  }
};

// Loads box data for a given boxId from /src/boxes or /src/old_boxes.
// For text files, we fetch their content from the asset URL.
const loadBoxData = async (boxId, isOldBox = false) => {
  // Select the appropriate context based on whether this is an old box
  const txtCtx = isOldBox ? oldTxtContext : txtContext;
  const imgCtx = isOldBox ? oldImgContext : imgContext;
  
  // Get URLs for text assets.
  const itemsUrl = getAssetFromContext(txtCtx, boxId, 'items.txt');
  const costsUrl = getAssetFromContext(txtCtx, boxId, 'costs.txt');
  const batchesUrl = getAssetFromContext(txtCtx, boxId, 'batches.txt');
  const titleUrl = getAssetFromContext(txtCtx, boxId, 'title.txt');
  // Get image URLs.
  const banner = getAssetFromContext(imgCtx, boxId, 'banner.jpg') || '';
  const thumb = getAssetFromContext(imgCtx, boxId, 'thumb.jpg') || '';

  // Fetch text content from the asset URLs.
  const itemsTxt = itemsUrl ? await fetchTextAsset(itemsUrl) : '';
  const costsTxt = costsUrl ? await fetchTextAsset(costsUrl) : '';
  const batchesTxt = batchesUrl ? await fetchTextAsset(batchesUrl) : '';
  const titleTxt = titleUrl ? await fetchTextAsset(titleUrl) : '';

  // Parse costs.txt into an object.
  const parseCosts = (text) => {
    if (!text) return {};
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const costs = {};
    lines.forEach((line) => {
      const parts = line.split(':');
      if (parts.length === 2) {
        const drawCount = parseInt(parts[0].trim());
        const cost = parseFloat(parts[1].trim());
        costs[drawCount] = cost;
      }
    });
    return costs;
  };

  // Parse batches.txt into an array.
  const parseBatches = (text) => {
    if (!text) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
      .map((line) => parseInt(line));
  };

  return {
    itemsTxt,                // Contents of items.txt (actual text content)
    costs: parseCosts(costsTxt),
    batches: parseBatches(batchesTxt),
    title: titleTxt,         // Contents of title.txt (actual text)
    banner,                  // Banner image URL
    thumb,                   // Thumbnail image URL
  };
};

// Helper to determine item rarity based on its rate.
const determineRarity = (rate) => {
  if (rate >= 0.01) return 'Common';
  else if (rate >= 0.005) return 'Uncommon';
  else if (rate >= 0.0015) return 'Rare';
  else return 'Jackpot';
};

const GachaSimulator = () => {
  const [availableBoxes, setAvailableBoxes] = useState([]);
  const [oldBoxes, setOldBoxes] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [isOldBox, setIsOldBox] = useState(false);
  const [boxData, setBoxData] = useState(null);
  const [prizeInput, setPrizeInput] = useState('');
  const [costs, setCosts] = useState({});
  const [batches, setBatches] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [awardedItems, setAwardedItems] = useState({});
  const [totalDraws, setTotalDraws] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [filter, setFilter] = useState('');
  const [visitorCount, setVisitorCount] = useState(0);
  const [globalSpent, setGlobalSpent] = useState(0);
  const [showOldBoxes, setShowOldBoxes] = useState(false);

  // On mount, find all available boxes by looking for thumb.jpg files.
  useEffect(() => {
    // Load active boxes
    const boxesContext = require.context('../boxes', true, /thumb\.jpg$/);
    const boxIds = boxesContext.keys().map((key) => {
      const parts = key.split('/');
      return parts[1];
    });
    const uniqueBoxIds = [...new Set(boxIds)];
    setAvailableBoxes(uniqueBoxIds);
    
    // Load old boxes
    const oldBoxesContext = require.context('../old_boxes', true, /thumb\.jpg$/);
    const oldBoxIds = oldBoxesContext.keys().map((key) => {
      const parts = key.split('/');
      return parts[1];
    });
    const uniqueOldBoxIds = [...new Set(oldBoxIds)];
    setOldBoxes(uniqueOldBoxIds);
    
    // Set initial selected box
    if (uniqueBoxIds.length > 0) {
      setSelectedBoxId(uniqueBoxIds[0]);
      setIsOldBox(false);
    }
  }, []);

  // When selectedBoxId changes, load its data.
  useEffect(() => {
    if (!selectedBoxId) return;
    const loadData = async () => {
      const data = await loadBoxData(selectedBoxId, isOldBox);
      if (data) {
        setBoxData(data);
        setPrizeInput(data.itemsTxt);
        setCosts(data.costs);
        setBatches(data.batches);
      }
    };
    loadData();
  }, [selectedBoxId, isOldBox]);

  // Re-parse rewards whenever prizeInput changes.
  useEffect(() => {
    parseRewards();
  }, [prizeInput]);

  // Parse rewards from prizeInput.
  // Expected format per line: "2.30%       Item Name"
  const parseRewards = () => {
    if (!prizeInput) {
      setRewards([]);
      return;
    }
    const parsedRewards = prizeInput
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        // Split based on tab or whitespace following the '%' character.
        const parts = line.split(/\t|(?<=\%)\s+/);
        if (parts.length < 2) return null;
        const rateStr = parts[0].trim();
        const item = parts[1].trim();
        const rate = parseFloat(rateStr.replace('%', '').trim()) / 100;
        return { item, rate };
      })
      .filter((entry) => entry !== null);
    setRewards(parsedRewards);
  };

  // Handle drawing items.
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
              rarity: determineRarity(reward.rate),
            };
          }
          break;
        }
      }
    }
    setAwardedItems(newAwardedItems);
    setTotalDraws((prev) => prev + drawCount);
    const batchCost = costs[drawCount] || 1.5 * drawCount;
    setTotalCost((prev) => prev + batchCost);
    try {
      const response = await fetch(`${API_URL}/api/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'spent', amount: batchCost }),
      });
      const data = await response.json();
      setGlobalSpent(data.totalSpent);
    } catch (error) {
      console.error('Failed to update total spent:', error);
    }
  };

  const filteredItems = Object.entries(awardedItems)
    .filter(([, data]) => filter === '' || data.rarity === filter)
    .sort((a, b) => a[0].localeCompare(b[0]));

  // Fetch initial visitor stats.
  useEffect(() => {
    const initVisitor = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  // Handle box selection
  const handleBoxSelect = (boxId, isOld = false) => {
    setSelectedBoxId(boxId);
    setIsOldBox(isOld);
    setAwardedItems({});
    setTotalDraws(0);
    setTotalCost(0);
  };

  return (
    <div className="p-4 bg-background text-foreground min-h-screen">
      <Card className="mb-4">
        <CardHeader>
          {boxData && boxData.banner && (
            // Wrap the banner in a container with a fixed max height and apply a gradient mask to fade out at the bottom.
            <div className="relative w-full" style={{ maxHeight: '300px', overflow: 'hidden' }}>
              <img
                src={boxData.banner}
                alt="Banner"
                className="w-full object-cover"
                style={{
                  // Apply a CSS mask so the image fades from opaque at the top to transparent at the bottom.
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                }}
              />
            </div>
          )}
          {boxData && boxData.title && (
            // Display the title text from title.txt (fetched content), not its URL.
            <div className="text-center text-2xl font-bold mt-2">
              {boxData.title}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {availableBoxes.map((boxId) => (
                <Button
                  key={boxId}
                  onClick={() => handleBoxSelect(boxId, false)}
                  variant={selectedBoxId === boxId && !isOldBox ? "default" : "outline"}
                >
                  <img
                    src={getAssetFromContext(imgContext, boxId, 'thumb.jpg') || ''}
                    alt={boxId}
                    className="w-6 h-6 object-cover mr-1"
                  />
                  {boxId}
                </Button>
              ))}
            </div>
            
            <div className="mt-2">
              <Button 
                onClick={() => setShowOldBoxes(!showOldBoxes)} 
                variant="outline"
                className="mb-2"
              >
                {showOldBoxes ? "Hide old boxes" : "Show old boxes"}
              </Button>
              
              {showOldBoxes && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {oldBoxes.map((boxId) => (
                    <Button
                      key={boxId}
                      onClick={() => handleBoxSelect(boxId, true)}
                      variant={selectedBoxId === boxId && isOldBox ? "default" : "outline"}
                    >
                      <img
                        src={getAssetFromContext(oldImgContext, boxId, 'thumb.jpg') || ''}
                        alt={boxId}
                        className="w-6 h-6 object-cover mr-1"
                      />
                      {boxId}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <h4 className="mb-2">
            To change the rates/items, copy from the RNG rates table linked in every gacha.
            Copy only the %s and the names, leave the headers out.
          </h4>
          {/* The textarea now shows the actual contents of items.txt */}
          <Textarea
            value={prizeInput}
            onChange={(e) => setPrizeInput(e.target.value)}
            className="w-full mb-4"
          />
          <div className="mb-4">
            {batches.map((batchSize) => (
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
          <div className="mt-4">
            <CircleGraph rewards={rewards} />
          </div>
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
