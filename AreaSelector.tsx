// components/AreaSelector.tsx

import React, { useMemo } from 'react';

// 型定義（外部ファイルで共通化するのが望ましいですが、一旦ここに置きます）
type Area = { id: string; floor: string; zone: string };
type Spot = { id: string; status: 'available' | 'reserved' | 'locked' | 'disabled'; floor: string; zone: string };

interface AreaSelectorProps {
  spots: Spot[];
  onSelectArea: (area: Area) => void;
}

export function AreaSelector({ spots, onSelectArea }: AreaSelectorProps) {
  // spotsデータからユニークなエリア情報と空き台数を計算
  const areasWithAvailability = useMemo(() => {
    const areaMap = new Map<string, { area: Area; total: number; available: number }>();

    spots.forEach(spot => {
      const areaId = `${spot.floor}-${spot.zone}`;
      if (!areaMap.has(areaId)) {
        areaMap.set(areaId, {
          area: { id: areaId, floor: spot.floor, zone: spot.zone },
          total: 0,
          available: 0,
        });
      }
      const current = areaMap.get(areaId)!;
      current.total++;
      if (spot.status === 'available') {
        current.available++;
      }
    });

    return Array.from(areaMap.values());
  }, [spots]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-1">エリアを選択してください</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areasWithAvailability.map(({ area, total, available }) => (
          <button
            key={area.id}
            onClick={() => onSelectArea(area)}
            className="text-left p-6 bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-indigo-50 transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{area.floor}</p>
                <h3 className="text-2xl font-bold text-gray-800">{area.zone}</h3>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-indigo-600">
                  {available}
                  <span className="text-sm font-normal text-gray-500"> / {total} 台</span>
                </p>
                <p className="text-xs text-gray-500">空き</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}