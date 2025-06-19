// components/ProfileRegistrationForm.tsx

import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { UserPlus, Car, Hash } from 'lucide-react';

interface ProfileRegistrationFormProps {
  onRegistrationComplete: () => void;
}

export function ProfileRegistrationForm({ onRegistrationComplete }: ProfileRegistrationFormProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<'normal' | 'kei'>('normal');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('ログイン情報が見つかりません。');
      return;
    }
    if (!fullName || !licensePlate) {
      toast.error('すべての項目を入力してください。');
      return;
    }

    setIsLoading(true);
    const userProfileRef = doc(db, 'users', user.uid);

    try {
      await setDoc(userProfileRef, {
        fullName,
        licensePlate,
        vehicleType,
        email: user.email,
        status: 'pending', // 'pending', 'approved', 'rejected'
        createdAt: serverTimestamp(),
      });
      toast.success('ご登録ありがとうございます。管理者による承認をお待ちください。');
      onRegistrationComplete();
    } catch (error) {
      console.error("Profile registration failed: ", error);
      toast.error('登録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">使用者情報の登録</h2>
        <p className="text-gray-500 mt-1">サービスのご利用には、初回登録が必要です。</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <UserPlus size={16} className="mr-2" />
            氏名
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            required
          />
        </div>
        <div>
          <label htmlFor="licensePlate" className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <Hash size={16} className="mr-2" />
            車両番号（ナンバープレート）
          </label>
          <input
            type="text"
            id="licensePlate"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            placeholder="例: 品川 300 あ 12-34"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder:text-gray-400"
            required
          />
        </div>
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <Car size={16} className="mr-2" />
            車格
          </label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="vehicleType"
                value="normal"
                checked={vehicleType === 'normal'}
                onChange={() => setVehicleType('normal')}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <span className="ml-2 text-gray-700">普通車</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="vehicleType"
                value="kei"
                checked={vehicleType === 'kei'}
                onChange={() => setVehicleType('kei')}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <span className="ml-2 text-gray-700">軽自動車</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isLoading ? '登録中...' : 'この内容で登録申請する'}
        </button>
      </form>
    </div>
  );
}
