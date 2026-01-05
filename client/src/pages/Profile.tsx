import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, IdCard, Camera, Loader2 } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "",
    phone: "",
    department: "",
    joinDate: "",
    avatar: "/placeholder-avatar.jpg"
  });

  // Hàm decode JWT payload giống như Login
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

  // Load user profile from backend
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Decode JWT để lấy username hoặc userId
      const payload = decodeJWT(token);
      if (!payload) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      // Gọi API để lấy thông tin us
      const response = await api.get(`/users/profile/${payload.username}`);

      const userData = response.data.result;
      setProfile({
        username: userData.username || payload.username || "",
        email: userData.email || "",
        fullName: userData.fullName || userData.name || "",
        role: userData.role || payload.role || "",
        phone: userData.phone || "",
        department: userData.department || "",
        joinDate: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : "",
        avatar: userData.avatar || "/placeholder-avatar.jpg"
      });

    } catch (err: any) {
      console.error("Error loading profile:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Unable to load user information");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const payload = decodeJWT(token);
      if (!payload) {
        navigate("/login");
        return;
      }

      // Gọi API để cập nhật thông tin user
      await api.put(`/users/profile/${payload.username}`, {
        email: profile.email,
        fullName: profile.fullName,
        phone: profile.phone,
        department: profile.department
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setIsEditing(false);
      // Reload profile để đảm bảo data mới nhất
      await loadUserProfile();
      
    } catch (err: any) {
      console.error("Error saving profile:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Unable to save information");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload profile để reset về data gốc
    loadUserProfile();
  };

  // Change password dialog state
  const [changeOpen, setChangeOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setChangeError(null);
    if (!oldPassword || !newPassword) {
      setChangeError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      setChangeError('New password must be at least 6 characters');
      return;
    }
    try {
      setChanging(true);
      await api.post('/users/change-password', { oldPassword, newPassword });
      alert('Password changed successfully');
      setChangeOpen(false);
      // Reset sau khi đóng dialog
      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangeError(null);
      }, 0);
    } catch (err: any) {
      console.error('Change password failed', err);
      setChangeError(err?.response?.data?.message || 'Unable to change password');
    } finally {
      setChanging(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Loading information...</h3>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Error loading information</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadUserProfile}>Try again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Personal Information</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {profile.role || "Not defined"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Profile Picture</CardTitle>
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
                <CardTitle>Detailed Information</CardTitle>
                <div className="space-x-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
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
                      Full Name
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
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      disabled={!isEditing}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select disabled={true} value={profile.role}>
                      <SelectTrigger>
                        <SelectValue placeholder="Not defined" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
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
                      <span className="font-medium">Joined:</span> {profile.joinDate}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString('en-US')}
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
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Change Password</h4>
                <p className="text-sm text-muted-foreground">Update your password to secure your account</p>
              </div>
              <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => {
                    // Reset form ngay khi click button
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setChangeError(null);
                  }}>Change Password</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    {changeError && <div className="text-sm text-destructive">{changeError}</div>}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setChangeOpen(false)} disabled={changing}>Cancel</Button>
                      <Button onClick={handleChangePassword} disabled={changing}>{changing ? 'Changing...' : 'Change Password'}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Enhance security for your account</p>
              </div>
              <Button variant="outline">Setup</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;