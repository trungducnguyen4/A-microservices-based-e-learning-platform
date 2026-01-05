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
  const [role, setRole] = useState("student"); // default role
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
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="h-10 text-sm sm:text-base"
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-10 text-sm sm:text-base"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-10 text-sm sm:text-base pr-14"
              />
              <button
                type="button"
                className="absolute right-2 sm:right-3 top-2.5 text-xs sm:text-sm text-primary hover:underline"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Button className="w-full h-10 text-sm sm:text-base" type="submit" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
            {error && <div className="text-red-500 text-xs sm:text-sm mt-2">{error}</div>}
            {success && <div className="text-green-500 text-xs sm:text-sm mt-2">Registration successful!</div>}
          </form>
          <Button
            className="w-full h-10 mt-3 sm:mt-4 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-100 text-gray-700 font-medium text-sm sm:text-base"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            onClick={handleGoogleLogin}
            variant="outline"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/32px-Google_%22G%22_Logo.svg.png" alt="Google" className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Sign up with Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
// ...existing code...