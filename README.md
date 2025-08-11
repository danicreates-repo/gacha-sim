# Mabinogi Gachapon Simulator

A React-based web application that simulates Mabinogi gachapon boxes using real published rates from Nexon's official announcements. This educational tool helps players understand the actual odds of obtaining rare items and encourages better spending habits.

## 🎯 Purpose

This simulator takes official gachapon rates published by Nexon for their MMORPG Mabinogi and allows users to experience the actual odds through free simulation. The goal is to:

- **Educate players** about real gachapon probabilities
- **Demonstrate unfavorable odds** for rare items
- **Encourage responsible spending** by showing the true cost of chasing rare items
- **Provide transparency** using official published rates

## 🏗️ Architecture

The project consists of two main components:

### Frontend (React)
- **Location**: `client/` directory
- **Framework**: React 18 with Create React App
- **Styling**: Tailwind CSS with custom UI components
- **Features**: Interactive gachapon simulation, visual rate display, statistics tracking

### Backend (Node.js/Express)
- **Location**: `server/` directory  
- **Framework**: Express.js
- **Database**: MongoDB for tracking global statistics
- **Features**: Visitor counting, total spent tracking, CORS handling

## 📦 Gachapon Box Structure

Each gachapon box is stored in `client/src/boxes/` with the following files:

```
box-name/
├── items.txt      # Item rates and names (format: "0.09% Item Name")
├── costs.txt      # Cost per draw batch (format: "1: 1.5")
├── batches.txt    # Available draw batch sizes (format: "1\n11\n45")
├── title.txt      # Box display name
├── banner.jpg     # Box banner image
└── thumb.jpg      # Box thumbnail image
```

### Data Format Examples

**items.txt:**
```
0.09%	Glorious Celestial Eminence Wings
0.11%	Virtuous Celestial Eminence Wings
1.45%	Speed Walk Potion 40% (30 min)
```
The simplest way to get this data at once is to open the news post posted by Nexon, clicking the "Items & Rates" button > and copy/pasting the table all at once, excluding the Rate & Item header.

**costs.txt:**
Doll Bag Box Example:
```
1: 4.9
3: 13.8
5: 22
```

Item Box Example:
```
1: 1.5
11: 15
45: 57.5
```

**batches.txt:**
```
1
11
45
```
In hindsight, the batches text document is redundant and it's tech debt.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (for backend statistics)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gacha-sim
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `server/` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/gachaSimulator
   PORT=3001
   ```

   Create a `.env` file in the `client/` directory:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

2. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🎮 How to Use

1. **Select a Gachapon Box**: Choose from available boxes using the thumbnail buttons
2. **View Rates**: The textarea shows the current item rates (editable for testing or fun)
3. **Draw Items**: Click draw buttons to simulate opening boxes
4. **View Results**: See your obtained items in the results table
5. **Filter by Rarity**: Use rarity filters to view specific item types
6. **Visual Analytics**: View the pie chart showing rate distribution

## 📊 Features

- **Real Rate Simulation**: Uses actual published rates from Nexon
- **Visual Rate Display**: Interactive pie chart showing item distribution
- **Statistics Tracking**: Global visitor count and total spent tracking
- **Rarity Classification**: Items automatically categorized by drop rate
- **Batch Drawing**: Support for multiple draw sizes (1x, 11x, 45x)
- **Historical Boxes**: Archive of past gachapon boxes
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Development

### Adding New Gachapon Boxes

1. Create a new folder in `client/src/boxes/` with the box name
2. Add the required files (items.txt, costs.txt, batches.txt, title.txt)
3. Add banner.jpg and thumb.jpg images
4. Rebuild the Client production build with `npm run build` and restart the service

### API Endpoints

- `GET /api/stats` - Retrieve visitor count and total spent
- `POST /api/stats` - Update visitor count or total spent

### Component Structure

- `GachaSimulator.js` - Main application component
- `CircleGraph.jsx` - Interactive pie chart for rate visualization
- UI components in `components/ui/` - Reusable UI elements

## 🎨 Technologies Used

- **Frontend**: React, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, MongoDB
- **Visualization**: Custom SVG pie chart
- **Deployment**: Configured for production builds

## 📈 Statistics Tracking

The application tracks:
- Total unique visitors
- Global amount spent across all users
- Individual user draw statistics

This data helps demonstrate the collective spending on gachapon systems.

## 🎯 Educational Impact

This simulator serves as an educational tool to:
- Show the mathematical reality of gachapon odds
- Help players make informed decisions about spending
- Provide transparency using official published rates
- Demonstrate the long-term cost of chasing rare items

## 📄 License

This project is for educational purposes and uses official published rates from Nexon's Mabinogi announcements.
Whatever conclusions you come to when comparing this project's box draw results to your in-game spending are your own 👀

## 🔗 Links

- **Live Demo**: [gacha.danii.io](https://gacha.danii.io)
- **Personal Site**: [repo.danii.io](https://repo.danii.io/)
