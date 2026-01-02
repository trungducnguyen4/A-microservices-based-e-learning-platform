import { useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student"); // default là người học
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL ?? "";
  const handleGoogleLogin = () => {
    window.location.href = `${authBaseUrl}/oauth2/authorization/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.post(`/users/register`, {
        username,
        password,
        email,
      });
      setSuccess(true);
      // Optionally, redirect or show a message
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">Đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2 text-sm text-primary hover:underline"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-500 text-sm mt-2">Đăng ký thành công!</div>}
          </form>
          <Button
            className="w-full mt-4 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-100 text-gray-700 font-medium"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            onClick={handleGoogleLogin}
            variant="outline"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/32px-Google_%22G%22_Logo.svg.png" alt="Google" className="h-5 w-5" />
            <span>Đăng ký với Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
// ...existing code...