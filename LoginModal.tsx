// components/LoginModal.tsx

import React, { useState } from 'react';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { Mail, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('メールアドレスを入力してください。');
      return;
    }
    setIsLoading(true);

    const actionCodeSettings = {
      url: window.location.href, // ログイン後にリダイレクトするURL
      handleCodeInApp: true,     // リンクをアプリ内で処理する
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // ユーザーが後で同じデバイスで戻ってきたときのためにメールアドレスを保存
      window.localStorage.setItem('emailForSignIn', email);
      toast.success('ログイン用のメールを送信しました。メールボックスをご確認ください。');
      onClose(); // モーダルを閉じる
    } catch (error: any) {
      console.error(error);
      toast.error('メールの送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsLoading(false);
      setEmail('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all">
        <div className="relative p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-full mb-3">
                <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">ログイン</h2>
            <p className="text-gray-600 mt-1">メールアドレスにログイン用のリンクを送信します。</p>
          </div>

          <form onSubmit={handleSendLink}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                {isLoading ? '送信中...' : 'ログインリンクを送信'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}