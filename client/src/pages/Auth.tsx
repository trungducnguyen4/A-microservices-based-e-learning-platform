import { useState } from "react";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = () => {
    window.location.href =
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=token&scope=email profile";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý đăng nhập/đăng ký ở đây
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập / Đăng ký</h2>
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full mb-3 px-3 py-2 border rounded"
            required
          />
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <a href="#" className="text-sm text-blue-500 hover:underline">Quên mật khẩu?</a>
          </div>
          <Button className="w-full mb-2" type="submit">
            Đăng nhập
          </Button>
        </form>
        <Button
          className="w-full mb-4 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-100 text-gray-700 font-medium"
          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
          onClick={handleGoogleLogin}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/32px-Google_%22G%22_Logo.svg.png" alt="Google" className="h-5 w-5" />
          <span>Đăng nhập với Google</span>
        </Button>
      </div>
    </div>
  );
};

export default Auth;