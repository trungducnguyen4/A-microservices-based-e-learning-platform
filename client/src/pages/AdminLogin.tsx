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
      // Use relative path to go through Vite proxy
      const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? '/api';
      const payload = { username, password };

      const response = await axios.post(
        `${API_BASE}/users/auth/admin-login`,
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
      const message = err.response?.data?.message || err.message || "Login failed. Please try again.";
      setError(`❌ ${message}`);
      console.error("Admin login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title={`Admin Login - ${APP_NAME}`} description="Admin portal login" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-3 sm:p-4">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

        <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800">
          <CardHeader className="space-y-1 text-center px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-primary/20 rounded-lg">
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-white">Admin Portal</CardTitle>
            <CardDescription className="text-sm sm:text-base text-slate-400">
              Sign in to manage the system
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="username" className="text-slate-200 text-sm">
                  Username / Email
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin or admin@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-10 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-slate-200 text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-10 text-sm sm:text-base"
                  required
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="p-2.5 sm:p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-xs sm:text-sm text-blue-300 text-center">
                📋 Only Admin accounts can access
              </div>
            </form>

            {/* Back Link */}
            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition"
              >
                ← Back to home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminLogin;
