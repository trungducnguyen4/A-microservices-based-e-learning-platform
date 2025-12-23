import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ChooseRole = () => {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | ''>('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error', message: string } | null>(null);

  // Utility to decode JWT
  const decodeJWT = (t: string) => {
    try {
      const payloadPart = t.split('.')[1];
      const decoded = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (err) {
      console.error('Failed to decode JWT', err);
      return null;
    }
  };

  // Extract token from query params after OAuth2 redirect
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store token so api calls can use it
      localStorage.setItem('token', token);

      // Decode JWT to check if user already has a role
      const decoded = decodeJWT(token);
      if (decoded) {
        const currentRole = decoded.role;
        console.log('JWT decoded - current role:', currentRole);

        // If user already has a role, skip choose-role and go to dashboard
        if (currentRole && currentRole !== 'null' && currentRole.trim() !== '') {
          console.log('User already has role:', currentRole);
          const normalizedRole = String(currentRole).toLowerCase();
          
          // Build user object from JWT
          const builtUser = {
            id: decoded.userId || decoded.sub || decoded.id || 'unknown',
            email: decoded.email || '',
            name: decoded.fullName || decoded.username || '',
            role: normalizedRole as any,
            avatar: decoded.avatar || undefined
          };

          // Update localStorage and AuthContext
          localStorage.setItem('user', JSON.stringify(builtUser));
          updateUser(builtUser);

          // Navigate to role-specific page
          navigateBasedOnRole(normalizedRole);
          return;
        }
      }
    }
  }, [searchParams]);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const navigateBasedOnRole = (selectedRole: string) => {
    const normalizedRole = selectedRole.toLowerCase();
    switch (normalizedRole) {
      case 'admin':
        navigate('/admin');
        break;
      case 'teacher':
        navigate('/teacher');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/');
    }
  };

  const submit = async () => {
    if (!role) return alert('Vui lòng chọn vai trò');
    setLoading(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        alert('Không tìm thấy token. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      // Call choose-role endpoint
      console.log('Calling POST /users/choose-role with role:', role);
      const res = await api.post('/users/choose-role', { role });
      console.log('Response:', res.data);
      
      if (res.data?.result) {
        const userResult = res.data.result;
        
        // Decode JWT to get updated claims
        const decoded = decodeJWT(token) || {};
        const normalizedRole = role.toLowerCase() as any;

        // Build updated user object
        const updatedUser = {
          id: userResult.id || decoded.userId || decoded.sub || 'unknown',
          email: userResult.email || decoded.email || '',
          name: userResult.fullName || decoded.fullName || decoded.username || '',
          role: normalizedRole,
          avatar: userResult.avatar || decoded.avatar || undefined
        };

        // Update localStorage and AuthContext
        localStorage.setItem('user', JSON.stringify(updatedUser));
        updateUser(updatedUser);

        showNotification('success', 'Cập nhật vai trò thành công!');
        
        // Navigate to appropriate page based on role
        setTimeout(() => navigateBasedOnRole(normalizedRole), 1500);
      } else {
        showNotification('error', res.data?.message || 'Cập nhật vai trò thất bại');
      }
    } catch (err: any) {
      console.error('Choose role error', err);
      console.error('Error response:', err.response?.data);
      showNotification('error', err.response?.data?.message || 'Lỗi khi cập nhật vai trò');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'info' ? 'bg-blue-500' :
          'bg-red-500'
        }`}>
          {notification.message}
        </div>
      )}
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