// components/Header.tsx

'use client';
import { useState } from 'react';
import { Car, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoginModal } from './LoginModal'; // 作成したモーダルをインポート

export function Header() {
  const { user, isLoading } = useAuth();
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Car className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">駐車場予約システム</h1>
        </div>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <span className="text-sm text-gray-500 hidden sm:block">
                {user.email}
              </span>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <LogOut size={16} />
                <span>ログアウト</span>
              </button>
            </>
          ) : (
            <button onClick={() => setLoginModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              <LogIn size={16} />
              <span>ログイン</span>
            </button>
          )}
        </div>
      </header>
      
      {/* ログインモーダルコンポーネント */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}
