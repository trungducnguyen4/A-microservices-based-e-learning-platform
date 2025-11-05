import { useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ChooseRole = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      setError("Vui lòng chọn vai trò!");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      await api.put(`/users/role`, { role: selectedRole });
      if (selectedRole === "student") {
        navigate("/student");
      } else if (selectedRole === "teacher") {
        navigate("/teacher");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Cập nhật vai trò thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-primary">Chọn vai trò của bạn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 justify-center my-6">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="radio"
                name="role"
                value="student"
                checked={selectedRole === "student"}
                onChange={() => setSelectedRole("student")}
                className="w-4 h-4"
              />
              Người học
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <Input
                type="radio"
                name="role"
                value="teacher"
                checked={selectedRole === "teacher"}
                onChange={() => setSelectedRole("teacher")}
                className="w-4 h-4"
              />
              Người dạy
            </Label>
          </div>
          <Button className="w-full" onClick={handleRoleSelect} disabled={loading}>
            {loading ? "Đang cập nhật..." : "Xác nhận"}
          </Button>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChooseRole;