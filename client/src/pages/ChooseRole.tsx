import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChooseRole = () => {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | ''>('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!role) return alert('Vui lòng chọn vai trò');
    setLoading(true);
    try {
      // Use the correct choose-role endpoint which accepts an authenticated POST
      // api already attaches Authorization header from localStorage via interceptor
      const res = await api.post('/users/choose-role', { role });
      if (res.data?.result) {
        updateUser({ role: role.toLowerCase() as any });
        alert('Cập nhật vai trò thành công. Vui lòng đăng xuất và đăng nhập lại để làm mới phiên.');
        navigate('/');
      } else {
        alert(res.data?.message || 'Cập nhật vai trò thất bại');
      }
    } catch (err: any) {
      console.error('Choose role error', err);
      alert(err.response?.data?.error || err.response?.data?.message || 'Lỗi khi cập nhật vai trò');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-center text-2xl font-bold mb-4">Chọn vai trò của bạn</h2>
        <div className="flex gap-6 justify-center my-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value="STUDENT" checked={role === 'STUDENT'} onChange={() => setRole('STUDENT')} />
            <span className="ml-2">Người học</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="role" value="TEACHER" checked={role === 'TEACHER'} onChange={() => setRole('TEACHER')} />
            <span className="ml-2">Người dạy</span>
          </label>
        </div>

        <button disabled={!role || loading} onClick={submit} className="w-full bg-blue-500 text-white py-2 rounded">
          {loading ? 'Đang cập nhật...' : 'Xác nhận'}
        </button>
      </div>
    </div>
  );
};

export default ChooseRole;