// CircleGraph.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// CircleGraph renders an SVG pie chart based on the rewards array.
// Each reward object should have an 'item' and a 'rate' property.
// The component calculates the relative proportion of each rate and draws a slice.
const CircleGraph = ({ rewards }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate total rate and prepare data
  const totalRate = rewards.reduce((sum, reward) => sum + reward.rate, 0);
  const sortedRewards = [...rewards].sort((a, b) => b.rate - a.rate);
  
  // Update dimensions based on viewport
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const size = Math.min(width, height) * 0.6; // 60% of the smaller dimension
      setDimensions({ width: size, height: size });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Helper function to convert polar coordinates to cartesian
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Generate arc data for the pie chart
  const generateArcs = (centerX, centerY, radius) => {
    let cumulativeAngle = 0;
    return sortedRewards.map((reward, index) => {
      const sliceAngle = (reward.rate / totalRate) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += sliceAngle;
      const endAngle = cumulativeAngle;
      
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      
      const pathData = [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'L', centerX, centerY,
        'Z'
      ].join(' ');

      const percentage = ((reward.rate / totalRate) * 100).toFixed(2);
      const labelAngle = startAngle + (sliceAngle / 2);
      const labelRadius = radius * 1.2;
      const labelPos = polarToCartesian(centerX, centerY, labelRadius, labelAngle);
      
      return {
        pathData,
        color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
        reward,
        percentage,
        labelPos,
        labelAngle,
        showLabel: sliceAngle > 5 // Only show labels for slices > 5 degrees
      };
    });
  };

  // Small preview graph
  const PreviewGraph = () => {
    const centerX = 50;
    const centerY = 50;
    const radius = 45;
    const arcs = generateArcs(centerX, centerY, radius);

    return (
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsModalOpen(true)}
      >
        <svg width="100" height="100" viewBox="0 0 100 100">
          {arcs.map((arc, idx) => (
            <g key={idx}>
              <path d={arc.pathData} fill={arc.color}>
                <title>{arc.reward.item}: {arc.percentage}%</title>
              </path>
              {arc.showLabel && (
                <text
                  x={arc.labelPos.x}
                  y={arc.labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="8"
                  transform={`rotate(${arc.labelAngle - 90}, ${arc.labelPos.x}, ${arc.labelPos.y})`}
                >
                  {arc.percentage}%
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Modal content with large graph
  const ModalContent = () => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    const arcs = generateArcs(centerX, centerY, radius);

    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Reward Probabilities</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0">
            <svg width={dimensions.width} height={dimensions.height}>
              {arcs.map((arc, idx) => (
                <g key={idx}>
                  <path d={arc.pathData} fill={arc.color}>
                    <title>{arc.reward.item}: {arc.percentage}%</title>
                  </path>
                  {arc.showLabel && (
                    <text
                      x={arc.labelPos.x}
                      y={arc.labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={dimensions.width * 0.02}
                      transform={`rotate(${arc.labelAngle - 90}, ${arc.labelPos.x}, ${arc.labelPos.y})`}
                    >
                      {arc.percentage}%
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          
          <div className="flex-grow overflow-hidden">
            <div className="bg-gray-50 rounded-lg p-4 h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedRewards.map((reward, index) => {
                  const percentage = ((reward.rate / totalRate) * 100).toFixed(2);
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm"
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                      />
                      <div className="flex-grow min-w-0">
                        <div className="font-medium truncate">{reward.item}</div>
                        <div className="text-sm text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PreviewGraph />
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-xl shadow-xl p-6 max-w-[95vw] max-h-[95vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <ModalContent />
          </div>
        </div>
      )}
    </>
  );
};

export default CircleGraph;
