
import React, { useState } from 'react';
import { db } from '../../data/db/dexie';
import { useSessionStore } from '../../store/useSessionStore';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { setUser, setOrg } = useSessionStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await db.users.where('username').equals(username).first();
      
      if (!user) {
        throw new Error('اسم المستخدم غير صحيح');
      }

      if (user.password_hash !== password) {
         throw new Error('كلمة المرور غير صحيحة');
      }

      if (!user.is_active) {
         throw new Error('تم تعطيل هذا الحساب');
      }

      // Success
      setUser(user.id, user.full_name);
      setOrg(user.org_id, 'main-branch'); // Default branch for MVP
      onLoginSuccess();

    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-cairo" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <Lock size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
          <p className="text-blue-100 mt-2 text-sm">نظام MicroPOS لإدارة المبيعات</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <User className="absolute right-3 top-3.5 text-gray-400" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Lock className="absolute right-3 top-3.5 text-gray-400" size={20} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
              {!loading && <LogIn size={20} />}
            </button>
            
            <div className="text-center text-xs text-gray-400 mt-4">
              بيانات الدخول الافتراضية: admin / 123456
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
