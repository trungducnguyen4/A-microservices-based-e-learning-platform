import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Seo from "@/components/Seo";
import { APP_NAME } from "@/lib/brand";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? 'http://localhost:8888';
      const payload = { username, password };

      const response = await axios.post(
        `${API_BASE}/api/users/auth/admin-login`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const apiResp = response.data;
      const token = apiResp?.result?.token;
      const user = apiResp?.result?.user;

      if (!token) {
        throw new Error(apiResp?.message || 'Login failed');
      }

      // Lưu token
      localStorage.setItem("token", token);
      
      // Parse token để lấy thông tin user
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      
      // Normalize role to lowercase để match với AuthContext
      const rawRole = tokenPayload.role || tokenPayload.roles || '';
      const normalizedRole = String(rawRole).toLowerCase();
      
      const adminUser = {
        id: tokenPayload.userId || tokenPayload.sub || tokenPayload.id,
        email: tokenPayload.email || tokenPayload.username,
        name: tokenPayload.fullName || tokenPayload.name || tokenPayload.username,
        role: normalizedRole,
        avatar: tokenPayload.avatar
      };
      localStorage.setItem("user", JSON.stringify(adminUser));

      // Force reload để AuthContext đọc lại localStorage
      window.location.href = "/admin";
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(`❌ ${message}`);
      console.error("Admin login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title={`Admin Login - ${APP_NAME}`} description="Đăng nhập quản trị viên" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

        <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white">Admin Portal</CardTitle>
            <CardDescription className="text-slate-400">
              Đăng nhập để quản lý hệ thống
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-200">
                  Username / Email
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin hoặc admin@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Đăng Nhập
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300 text-center">
                📋 Chỉ tài khoản Admin mới có thể truy cập
              </div>
            </form>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-slate-400 hover:text-slate-200 transition"
              >
                ← Quay lại trang chủ
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminLogin;
