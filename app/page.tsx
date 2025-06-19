// app/page.tsx

'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  runTransaction,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Toaster, toast } from 'react-hot-toast';
import { AreaSelector } from '@/components/AreaSelector';
import { SpotSelector } from '@/components/SpotSelector';
import { ProfileRegistrationForm } from '@/components/ProfileRegistrationForm';
import { BookingModal } from '@/components/BookingModal';
import { Hourglass, UserX } from 'lucide-react';

// 型定義
type Area = { id: string; floor: string; zone: string; };
type Spot = { id: string; number: number; zone: string; type: 'normal' | 'kei'; status: 'available' | 'reserved' | 'locked' | 'disabled'; floor: string; lockedBy?: string; };
type UserProfile = { status: 'pending' | 'approved' | 'rejected'; fullName: string; };

const StatusDisplay = ({ status, fullName }: { status: 'pending' | 'rejected', fullName: string }) => {
    const statusInfo = {
        pending: { icon: <Hourglass className="w-16 h-16 text-yellow-500" />, title: '承認をお待ちください', message: `${fullName} 様、ご登録ありがとうございます。現在、管理者による内容の確認を行っております。承認まで今しばらくお待ちください。`},
        rejected: { icon: <UserX className="w-16 h-16 text-red-500" />, title: '登録が承認されませんでした', message: `申し訳ありません、${fullName} 様。ご登録いただいた内容に確認が必要な点がありました。お手数ですが、管理者までお問い合わせください。`}
    }
    return (
        <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-xl shadow-lg">
            <div className="flex justify-center mb-4">{statusInfo[status].icon}</div>
            <h2 className="text-2xl font-bold text-gray-800">{statusInfo[status].title}</h2>
            <p className="text-gray-600 mt-2">{statusInfo[status].message}</p>
        </div>
    )
}

export default function HomePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);
  const [view, setView] = useState<'area' | 'spot'>('area');
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [lockedByMeId, setLockedByMeId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isBookingLoading, setBookingLoading] = useState(false);

  useEffect(() => { if (user) { const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => { if (doc.exists()) { setUserProfile(doc.data() as UserProfile); } else { setUserProfile(null); } setProfileLoading(false); }); return () => unsub(); } else if (!isAuthLoading) { setProfileLoading(false); } }, [user, isAuthLoading]);
  useEffect(() => { const unsubscribe = onSnapshot(collection(db, "parkingLots"), (snapshot) => { const spotsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Spot[]; setSpots(spotsData); }); return () => unsubscribe(); }, []);

  const handleSelectArea = (area: Area) => { setSelectedArea(area); setView('spot'); };
  const handleBackToArea = () => { setView('area'); setSelectedArea(null); };

  const unlockSpot = useCallback(async (spotId: string | null) => {
    if (!spotId) return;
    const spotRef = doc(db, "parkingLots", spotId);
    try {
      await runTransaction(db, async (transaction) => {
        const spotDoc = await transaction.get(spotRef);
        if (spotDoc.exists() && spotDoc.data().lockedBy === user?.uid) {
          transaction.update(spotRef, { status: 'available', lockedBy: null });
        }
      });
    } catch (error) {
      console.error("Unlock failed:", error);
    }
  }, [user]);

  const handleSelectSpot = useCallback(async (spotId: string) => {
    if (!user) { toast.error('予約するにはログインが必要です。'); return; }
    if (lockedByMeId) { toast.error('一度に選択できるのは1区画のみです。'); return; }
    
    const spotRef = doc(db, "parkingLots", spotId);
    try {
      await runTransaction(db, async (transaction) => {
        const spotDoc = await transaction.get(spotRef);
        if (!spotDoc.exists() || spotDoc.data().status !== 'available') throw new Error('この区画は現在利用できません。');
        transaction.update(spotRef, { status: 'locked', lockedBy: user.uid });
      });
      setLockedByMeId(spotId);
      setSelectedSpotId(spotId);
    } catch (error: any) {
      toast.error(error.message || '区画の選択に失敗しました。');
    }
  }, [user, lockedByMeId]);

  const handleCloseModal = useCallback(() => {
    unlockSpot(lockedByMeId);
    setLockedByMeId(null);
    setSelectedSpotId(null);
  }, [unlockSpot, lockedByMeId]);

 // app/page.tsx の handleConfirmBooking 関数

  const handleConfirmBooking = async ({ spotId, startTime, endTime }: { spotId: string; startTime: string; endTime: string }) => {
    if (!user) return;
    setBookingLoading(true);
    const spotRef = doc(db, "parkingLots", spotId);
    const reservationRef = doc(collection(db, "reservations"));
    try {
      await runTransaction(db, async (transaction) => {
        const spotDoc = await transaction.get(spotRef);
        if (!spotDoc.exists() || spotDoc.data().lockedBy !== user.uid) throw new Error('この区画を予約する権限がありません。');
        transaction.update(spotRef, { status: 'reserved', lockedBy: null });
        

        // 文字列からDateオブジェクトに変換し、さらにFirestoreのTimestamp形式に変換
        transaction.set(reservationRef, { 
            userId: user.uid, 
            spotId, 
            startTime: new Date(startTime), // ISO文字列をDateオブジェクトに
            endTime: new Date(endTime),     // ISO文字列をDateオブジェクトに
            createdAt: serverTimestamp() 
        });
      });
      toast.success('予約が完了しました！');
      setLockedByMeId(null);
      setSelectedSpotId(null);
    } catch (error: any) {
       toast.error(error.message || '予約処理に失敗しました。');
       unlockSpot(spotId);// 失敗した場合もロックを解除
       setLockedByMeId(null);
       setSelectedSpotId(null);
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedSpot = useMemo(() => spots.find(s => s.id === selectedSpotId) || null, [spots, selectedSpotId]);

  const renderContent = () => {
    if (isAuthLoading || isProfileLoading) return <p>ユーザー情報を読み込み中...</p>;
    if (!user) return <div className="text-center p-8 bg-white rounded-lg shadow-md"><p>駐車場を予約するには、ログインしてください。</p></div>
    if (!userProfile) return <ProfileRegistrationForm onRegistrationComplete={() => setProfileLoading(true)} />;
    if (userProfile.status === 'pending' || userProfile.status === 'rejected') return <StatusDisplay status={userProfile.status} fullName={userProfile.fullName}/>;
    if (userProfile.status === 'approved') {
        if (view === 'area') return <AreaSelector spots={spots} onSelectArea={handleSelectArea} />;
        if (view === 'spot' && selectedArea) return <SpotSelector area={selectedArea} spots={spots.filter(s => s.floor === selectedArea.floor && s.zone === selectedArea.zone)} onBack={handleBackToArea} onSelectSpot={handleSelectSpot} currentUserId={user.uid} />;
    }
    return <p>不明な状態です。管理者にお問い合わせください。</p>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Toaster position="top-center" />
      <main className="container mx-auto p-4 md:p-6">{renderContent()}</main>
      <BookingModal spot={selectedSpot} onClose={handleCloseModal} onConfirm={handleConfirmBooking} isLoading={isBookingLoading} />
    </div>
  );
}
