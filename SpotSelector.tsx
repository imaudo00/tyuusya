// components/SpotSelector.tsx

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { ParkingSpot } from './ParkingSpot';

// 型定義
type Area = { id: string; floor: string; zone: string };
type Spot = { id: string; number: number; zone: string; type: 'normal' | 'kei'; status: 'available' | 'reserved' | 'locked' | 'disabled'; floor: string; lockedBy?: string; };

const Legend = () => (
    <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 my-4 p-2 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center"><div className="w-4 h-4 bg-white border-2 border-gray-300 rounded-md mr-2"></div><span className="text-gray-600">空き</span></div>
        <div className="flex items-center"><div className="w-4 h-4 bg-red-500 rounded-md mr-2"></div><span className="text-gray-600">予約済</span></div>
        <div className="flex items-center"><div className="w-4 h-4 bg-blue-500 rounded-md mr-2"></div><span className="text-gray-600">選択中</span></div>
        <div className="flex items-center"><div className="w-4 h-4 bg-gray-400 rounded-md mr-2"></div><span className="text-gray-600">選択不可</span></div>
        <div className="flex items-center"><div className="w-4 h-4 bg-yellow-300 border border-gray-400 rounded-md mr-2 flex items-center justify-center text-xs font-bold text-gray-600">軽</div><span className="text-gray-600">軽専用</span></div>
    </div>
);

interface SpotSelectorProps {
  area: Area;
  spots: Spot[];
  onBack: () => void;
  onSelectSpot: (spotId: string) => void;
  currentUserId: string;
}

export function SpotSelector({ area, spots, onBack, onSelectSpot, currentUserId }: SpotSelectorProps) {
  const sortedSpots = [...spots].sort((a, b) => a.number - b.number);

  return (
    <div>
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 transition-colors mr-2">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div>
          <p className="text-sm text-gray-500">{area.floor}</p>
          <h2 className="text-2xl font-bold text-gray-800">{area.zone}</h2>
        </div>
      </div>
      <Legend />
      
      <div className="flex overflow-x-auto p-4 bg-gray-200 rounded-lg -mx-4">
        <div className="flex flex-nowrap">
          {sortedSpots.map(spot => {
            // 他の人がロックしている場合は 'disabled' 扱いにする
            const visualStatus = spot.status === 'locked' && spot.lockedBy !== currentUserId ? 'disabled' : spot.status;
            
            return (
              <ParkingSpot
                key={spot.id}
                spot={{ ...spot, status: visualStatus }}
                onClick={() => onSelectSpot(spot.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
