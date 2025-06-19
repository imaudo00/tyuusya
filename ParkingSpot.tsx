// components/ParkingSpot.tsx

import { cn } from "@/lib/utils";

// 型定義
type SpotStatus = 'available' | 'reserved' | 'locked' | 'disabled';
interface ParkingSpotProps {
  spot: {
    id: string;
    number: number;
    zone: string;
    type: 'normal' | 'kei';
    status: SpotStatus;
  };
  onClick: () => void;
}

export function ParkingSpot({ spot, onClick }: ParkingSpotProps) {
  // spot.statusが 'reserved' または 'disabled' の場合にボタンを無効化
  const isDisabled = spot.status === 'reserved' || spot.status === 'disabled';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-20 h-28 m-1 rounded-lg flex flex-col items-center justify-center transition-all duration-200 shadow-sm border-2 relative flex-shrink-0",
        // 背景色を動的に変更
        {
          'bg-white hover:bg-blue-100 border-gray-300': spot.status === 'available',
          'bg-red-500 border-red-700 cursor-not-allowed': spot.status === 'reserved',
          'bg-blue-500 border-blue-700': spot.status === 'locked',
          'bg-gray-300 border-gray-400 cursor-not-allowed': spot.status === 'disabled',
        }
      )}
    >
      {spot.type === 'kei' && (
        <div className="absolute top-1 right-1 text-xs bg-yellow-300 text-yellow-800 font-bold w-4 h-4 flex items-center justify-center rounded-full">軽</div>
      )}
      
      {/* ↓↓↓ ここを修正しました！ ↓↓↓ */}
      <span className={cn(
        "font-bold text-xl",
        // 文字色を動的に変更
        {
            "text-gray-800": spot.status === 'available',
            "text-white": spot.status === 'reserved' || spot.status === 'locked',
            "text-gray-500": spot.status === 'disabled',
        }
      )}>
        {spot.number}
      </span>
      
      <span className={cn(
        "text-xs opacity-80",
        // ゾーン名の文字色も同様に修正
        {
            "text-gray-600": spot.status === 'available',
            "text-white": spot.status === 'reserved' || spot.status === 'locked',
            "text-gray-500": spot.status === 'disabled',
        }
      )}>
        {spot.zone}
      </span>
    </button>
  );
}
