import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, IdCard, Camera } from "lucide-react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: "nguyen.duc.trung",
    email: "trung.nguyen@example.com",
    fullName: "Nguyễn Đức Trung",
    role: "Teacher",
    phone: "0123456789",
    department: "Khoa Công nghệ Thông tin",
    joinDate: "15/01/2023",
    avatar: "/placeholder-avatar.jpg"
  });

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Save to backend when connected
  };

  const handleCancel = () => {
    setIsEditing(false);
    // TODO: Reset form data
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Thông tin cá nhân</h1>
            <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {profile.role}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Ảnh đại diện</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar} alt="Avatar" />
                  <AvatarFallback className="text-2xl">
                    {profile.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                  variant="secondary"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{profile.fullName}</h3>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Thông tin chi tiết</CardTitle>
                <div className="space-x-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        Hủy
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        Lưu
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Tên đăng nhập
                    </Label>
                    <Input
                      id="username"
                      value={profile.username}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, username: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <IdCard className="h-4 w-4" />
                      Họ và tên
                    </Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Số điện thoại
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Vai trò</Label>
                    <Select disabled={!isEditing} value={profile.role}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Học viên</SelectItem>
                        <SelectItem value="Teacher">Giảng viên</SelectItem>
                        <SelectItem value="Admin">Quản trị viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Khoa/Phòng ban</Label>
                    <Input
                      id="department"
                      value={profile.department}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, department: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Ngày tham gia:</span> {profile.joinDate}
                    </div>
                    <div>
                      <span className="font-medium">Cập nhật lần cuối:</span> {new Date().toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Đổi mật khẩu</h4>
                <p className="text-sm text-muted-foreground">Cập nhật mật khẩu để bảo mật tài khoản</p>
              </div>
              <Button variant="outline">Đổi mật khẩu</Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Xác thực hai bước</h4>
                <p className="text-sm text-muted-foreground">Tăng cường bảo mật cho tài khoản của bạn</p>
              </div>
              <Button variant="outline">Cài đặt</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;