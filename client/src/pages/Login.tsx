import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Hàm decode JWT payload
  const decodeJWT = (token: string) => {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  const handleGoogleLogin = () => {
    window.location.href =
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=token&scope=email profile";
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  try {
    const response = await axios.post("http://localhost:8080/user/auth/login", {
      username,
      password,
    });

    const token = response.data.result.token;
    localStorage.setItem("token", token);
    setSuccess(true);

    // Decode JWT để lấy thông tin user
    const payload = decodeJWT(token);
    
    if (payload) {
      const role = payload.role;
      
      if (!role) {
        navigate("/choose-role"); // Chuyển tới trang chọn role
      } else if (role === "student") {
        navigate("/student");
      } else if (role === "teacher") {
        navigate("/teacher");
      }
    } else {
      // Nếu không decode được JWT, chuyển tới trang chọn role
      navigate("/choose-role");
    }
  } catch (err: any) {
    setError(err.response?.data?.message || "Đăng nhập thất bại");
  } finally {
    setLoading(false);
  }
};

  // ...existing code...
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-primary">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <div className="flex justify-between items-center">
              <a href="#" className="text-sm text-blue-500 hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            {success && <div className="text-green-500 text-sm mt-2">Đăng nhập thành công!</div>}
          </form>
          <Button
            className="w-full mt-4 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-100 text-gray-700 font-medium"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            onClick={handleGoogleLogin}
            variant="outline"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/32px-Google_%22G%22_Logo.svg.png"
              alt="Google"
              className="h-5 w-5"
            />
            <span>Đăng nhập với Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;