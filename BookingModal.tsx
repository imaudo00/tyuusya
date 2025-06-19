// components/BookingModal.tsx

// Reactの基本的な機能と、状態管理(useState)、副作用(useEffect)のフックをインポート
import React, { useState, useEffect } from 'react';
// アイコンをインポート
import { Car, Clock, X } from 'lucide-react';
// 通知（トースト）表示ライブラリをインポート
import { toast } from 'react-hot-toast';

// TypeScriptのための型定義: このコンポーネントが受け取るprops（プロパティ）の型を定義します
// 駐車スペース(spot)の情報
type Spot = { 
  id: string; 
  number: number; 
  zone: string; 
  type: 'normal' | 'kei'; 
  floor: string; 
};

// このコンポーネントが受け取るpropsの型定義
interface BookingModalProps {
  spot: Spot | null;                      // 表示対象の駐車スペース情報。なければnull。
  onClose: () => void;                    // モーダルを閉じるための関数
  onConfirm: (bookingDetails: {          // 予約確定ボタンが押されたときに実行される関数
    spotId: string; 
    startTime: string; 
    endTime: string 
  }) => void;
  isLoading: boolean;                     // 予約処理中かどうかを示すフラグ
}

// Dateオブジェクトを'HH:mm'形式の文字列（例: "09:30"）に変換する便利な関数
const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};


// BookingModalコンポーネント本体
export function BookingModal({ spot, onClose, onConfirm, isLoading }: BookingModalProps) {
  
  // spot情報が渡されていない（nullの）場合は、何も表示せずに処理を終了する
  // これにより、モーダルが表示されるべきでない時にエラーが出るのを防ぐ
  if (!spot) {
    return null;
  }

  // --- State（状態）の定義 ---
  // useStateを使って、このコンポーネント内で変化する値を管理します

  // 開始時刻のドロップダウンに表示する選択肢のリスト
  const [startTimeOptions, setStartTimeOptions] = useState<{label: string, value: string}[]>([]);
  // 終了時刻のドロップダウンに表示する選択肢のリスト
  const [endTimeOptions, setEndTimeOptions] = useState<{label: string, value: string}[]>([]);
  
  // ユーザーが選択した開始時刻（値はISO 8601形式の文字列で管理）
  const [startTime, setStartTime] = useState('');
  // ユーザーが選択した終了時刻（値はISO 8601形式の文字列で管理）
  const [endTime, setEndTime] = useState('');

  // --- 副作用フック (useEffect) ---
  // 特定の値が変更されたタイミングで、特定の処理を実行します

  // 【効果1】開始時刻の選択肢を動的に生成する
  // このモーダルが開かれた（spot情報が渡された）時に一度だけ実行される
  useEffect(() => {
    const now = new Date();
    const roundedUpNow = new Date(now);
    
    // 現在時刻を、次の30分単位に切り上げる（例: 09:10 → 09:30, 09:35 → 10:00）
    // これにより、過去の時間を予約できなくする
    if (roundedUpNow.getMinutes() > 0 && roundedUpNow.getMinutes() <= 30) {
      roundedUpNow.setMinutes(30, 0, 0);
    } else if (roundedUpNow.getMinutes() > 30) {
      roundedUpNow.setHours(roundedUpNow.getHours() + 1, 0, 0, 0);
    } else {
      roundedUpNow.setSeconds(0,0); // ちょうど00分の場合はそのまま
    }
    
    // 予約可能な最終時刻（現在から16時間後）を計算
    const limit = new Date(now.getTime() + 16 * 60 * 60 * 1000); 
    
    const options: {label: string, value: string}[] = [];
    let currentTime = new Date(roundedUpNow);

    // 切り上げた現在時刻から16時間後まで、30分ごとに選択肢を追加していく
    while (currentTime <= limit) {
      options.push({
        label: formatTime(currentTime),      // 表示用: "10:30"
        value: currentTime.toISOString(),    // 内部データ用: "2025-06-13T01:30:00.000Z"
      });
      // 時刻を30分進める
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    // 生成した選択肢をstateに保存
    setStartTimeOptions(options);
    // 最初の選択肢をデフォルトの開始時刻として設定
    if (options.length > 0) {
      setStartTime(options[0].value);
    }
  }, [spot]); // spotが変わった（モーダルが開かれた）時にのみこの処理を実行

  // 【効果2】終了時刻の選択肢を、開始時刻に応じて動的に生成する
  // startTime（開始時刻）が変更されるたびに実行される
  useEffect(() => {
    // 開始時刻がまだ選択されていなければ、何もしない
    if (!startTime) return;
    
    const startDateTime = new Date(startTime);
    // 予約可能な最終時刻（選択された開始時刻の10時間後）を計算
    const limit = new Date(startDateTime.getTime() + 10 * 60 * 60 * 1000); 
    
    const options: {label: string, value: string}[] = [];
    // 最初の選択肢は、開始時刻の30分後から
    let currentTime = new Date(startDateTime);
    currentTime.setMinutes(currentTime.getMinutes() + 30);

    // 開始時刻の30分後から10時間後まで、30分ごとに選択肢を追加
    while (currentTime <= limit) {
      options.push({
        label: formatTime(currentTime),
        value: currentTime.toISOString(),
      });
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    // 生成した選択肢をstateに保存
    setEndTimeOptions(options);

    // 開始時刻の変更により、以前選んでいた終了時刻が無効になった場合の処理
    const isCurrentEndTimeValid = options.some(option => option.value === endTime);
    if (!isCurrentEndTimeValid && options.length > 0) {
      // 無効な場合は、新しい選択肢の中の最初の値をデフォルトとして設定
      setEndTime(options[0].value);
    } else if (options.length === 0) {
      // 選択肢が一つもなくなった場合は、終了時刻を空にする
      setEndTime('');
    }
  }, [startTime, endTime]); // startTimeまたはendTimeが変わるたびにこの処理を実行


  // 「予約確定」ボタンがクリックされたときの処理
  const handleConfirmClick = () => {
    // 時刻が正しく選択されているか確認
    if (!startTime || !endTime) {
      toast.error('開始時刻と終了時刻を選択してください。');
      return;
    }

    // 親コンポーネント(page.tsx)に、確定した予約情報を渡す
    onConfirm({
      spotId: spot.id,
      startTime: startTime, // ISO文字列のまま渡す
      endTime: endTime,
    });
  };

  // --- JSX（画面の見た目部分） ---
  return (
    // モーダル全体を覆う背景
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      {/* モーダル本体 */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="relative p-6">
          {/* 閉じるボタン */}
          <button onClick={onClose} disabled={isLoading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <X size={24} />
          </button>
          
          {/* ヘッダーセクション */}
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full mr-4"><Car className="w-8 h-8 text-indigo-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">予約確認</h2>
              <p className="text-gray-600">以下の内容で予約を確定しますか？</p>
            </div>
          </div>
          
          {/* 予約内容表示セクション */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">階</span><span className="font-bold text-lg text-indigo-600">{spot.floor}</span></div>
            <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">駐車No.</span><span className="font-bold text-lg text-indigo-600">{spot.zone} - {spot.number}</span></div>
          </div>

          {/* 時刻選択セクション */}
          <div className="mt-6">
            <div className="flex items-center text-gray-700 mb-2"><Clock className="w-5 h-5 mr-2 text-gray-500" /><h3 className="font-semibold">利用時間を選択</h3></div>
            <div className="grid grid-cols-2 gap-4">
              {/* 開始時刻ドロップダウン */}
              <div>
                <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">開始時刻</label>
                <select id="start-time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900">
                  {startTimeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {/* 終了時刻ドロップダウン */}
              <div>
                <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">終了時刻</label>
                <select id="end-time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900" disabled={!startTime}>
                  {endTimeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* フッターボタンセクション */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
          <button onClick={onClose} disabled={isLoading} className="px-6 py-2 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50">
            キャンセル
          </button>
          <button onClick={handleConfirmClick} disabled={isLoading} className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-colors shadow-md disabled:bg-indigo-400">
            {isLoading ? '処理中...' : '予約確定'}
          </button>
        </div>
      </div>
    </div>
  );
}
