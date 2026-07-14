'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, KeyRound, Building2 } from 'lucide-react';

export default function PortalLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    cardNumber: '',
    passwordPin: '',
    fullName: '',
    staffCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value.toUpperCase() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          ...formData
        })
      });
      const data = await res.json();
      
      if (data.success) {
        router.push('/portal/dashboard');
      } else {
        setError(data.error || 'Có lỗi xảy ra.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {isLogin ? 'Đăng nhập Hồ sơ' : 'Tạo Hồ sơ mới'}
            </h2>
            <p className="text-sm text-slate-500">
              {isLogin ? 'Tra cứu và cập nhật hồ sơ Nenkin của bạn' : 'Bắt đầu quy trình làm hồ sơ Nenkin tự động'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 ml-1">Mã Nhân Viên giới thiệu (Bắt buộc)</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input 
                    required
                    name="staffCode"
                    value={formData.staffCode}
                    onChange={handleChange}
                    placeholder="VD: NV001" 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>
            )}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 ml-1">Họ và tên (Romaji không dấu)</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input 
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="NGUYEN VAN A" 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 ml-1">Mã Thẻ Ngoại Kiều (Zairyu Card)</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  required
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="AB12345678CD" 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 ml-1">Mật khẩu (4 số năm sinh)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="password"
                  name="passwordPin"
                  value={formData.passwordPin}
                  onChange={handleChange}
                  placeholder="VD: 1995" 
                  maxLength={4}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none tracking-widest font-mono"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Đang xử lý...' : (isLogin ? 'Tra cứu Hồ sơ' : 'Đăng ký Hồ sơ')}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
          <p className="text-sm text-slate-600">
            {isLogin ? 'Chưa có hồ sơ?' : 'Đã có hồ sơ?'} 
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }} 
              className="ml-2 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
            >
              {isLogin ? 'Tạo mới ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
