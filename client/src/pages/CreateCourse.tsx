import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, UserPlus, X, Calendar, Clock, Users, Repeat } from "lucide-react";

export default function CreateSchedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    teacherId: "",
    title: "",
    startTime: "",
    endTime: "",
    recurrenceRule: "",
    collaborators: [] as string[]
  });
  const [selectedCollaborators, setSelectedCollaborators] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("none");
  const [weekDays, setWeekDays] = useState<string[]>([]);

  // Mock collaborators data (teachers/assistants)
  const availableCollaborators = [
    { id: "teacher1", name: "Phạm Văn Minh", email: "minh.pham@edu.com", avatar: null, role: "teacher" },
    { id: "teacher2", name: "Lê Thị Hoa", email: "hoa.le@edu.com", avatar: null, role: "teacher" },
    { id: "assistant1", name: "Nguyễn Văn Tú", email: "tu.nguyen@edu.com", avatar: null, role: "assistant" },
    { id: "assistant2", name: "Trần Thị Mai", email: "mai.tran@edu.com", avatar: null, role: "assistant" },
  ];

  // Decode JWT để lấy teacherId
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

  // Load teacher ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = decodeJWT(token);
      if (payload) {
        setFormData(prev => ({ ...prev, teacherId: payload.sub }));
      }
    }
  }, []);

  const filteredCollaborators = availableCollaborators.filter(
    collab => 
      collab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collab.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(collab => !selectedCollaborators.find(s => s.id === collab.id));

  const addCollaborator = (collaborator: any) => {
    setSelectedCollaborators([...selectedCollaborators, collaborator]);
    setFormData({
      ...formData, 
      collaborators: [...formData.collaborators, collaborator.id]
    });
  };

  const removeCollaborator = (collaboratorId: string) => {
    setSelectedCollaborators(selectedCollaborators.filter(s => s.id !== collaboratorId));
    setFormData({
      ...formData,
      collaborators: formData.collaborators.filter(id => id !== collaboratorId)
    });
  };

  // Generate recurrence rule based on selected options
  const generateRecurrenceRule = () => {
    if (recurrenceType === "none") return "";
    
    let rule = "FREQ=";
    switch (recurrenceType) {
      case "daily":
        rule += "DAILY";
        break;
      case "weekly":
        rule += "WEEKLY";
        if (weekDays.length > 0) {
          rule += `;BYDAY=${weekDays.join(",")}`;
        }
        break;
      case "monthly":
        rule += "MONTHLY";
        break;
      default:
        return "";
    }
    return rule;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const recurrenceRule = generateRecurrenceRule();
      
      const scheduleData = {
        ...formData,
        recurrenceRule,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      };

      await axios.post("http://localhost:3636/schedule/create", scheduleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      navigate("/teacher");
    } catch (err: any) {
      console.error("Error creating schedule:", err);
      setError(err.response?.data?.message || "Không thể tạo lịch học");
    } finally {
      setLoading(false);
    }
  };

  const handleWeekDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setWeekDays([...weekDays, day]);
    } else {
      setWeekDays(weekDays.filter(d => d !== day));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/teacher")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tạo Lịch Học Mới</h1>
            <p className="text-gray-600">Thiết lập lịch học cho lớp của bạn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Thông Tin Lịch Học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="title">Tiêu Đề Lịch Học *</Label>
                    <Input
                      id="title"
                      placeholder="Ví dụ: Lớp Toán Lớp 10A - Chương 1"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Thời Gian Bắt Đầu *</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endTime">Thời Gian Kết Thúc *</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {/* Recurrence Settings */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4" />
                      <Label>Quy Tắc Lặp Lại</Label>
                    </div>
                    
                    <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tần suất lặp lại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không lặp lại</SelectItem>
                        <SelectItem value="daily">Hàng ngày</SelectItem>
                        <SelectItem value="weekly">Hàng tuần</SelectItem>
                        <SelectItem value="monthly">Hàng tháng</SelectItem>
                      </SelectContent>
                    </Select>

                    {recurrenceType === "weekly" && (
                      <div className="space-y-2">
                        <Label>Chọn các ngày trong tuần:</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "MO", label: "Thứ 2" },
                            { value: "TU", label: "Thứ 3" },
                            { value: "WE", label: "Thứ 4" },
                            { value: "TH", label: "Thứ 5" },
                            { value: "FR", label: "Thứ 6" },
                            { value: "SA", label: "Thứ 7" },
                            { value: "SU", label: "Chủ nhật" }
                          ].map((day) => (
                            <div key={day.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={day.value}
                                checked={weekDays.includes(day.value)}
                                onCheckedChange={(checked) => handleWeekDayChange(day.value, checked as boolean)}
                              />
                              <Label htmlFor={day.value} className="text-sm">{day.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Collaborators Selection */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Cộng Tác Viên
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm giảng viên..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredCollaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={collaborator.avatar} />
                            <AvatarFallback>
                              {collaborator.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{collaborator.name}</p>
                            <p className="text-xs text-gray-500">{collaborator.email}</p>
                            <Badge variant="outline" className="text-xs">
                              {collaborator.role === 'teacher' ? 'Giảng viên' : 'Trợ giảng'}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addCollaborator(collaborator)}>
                          <UserPlus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {selectedCollaborators.length > 0 && (
                    <div className="border-t pt-4">
                      <Label>Cộng Tác Viên Đã Chọn ({selectedCollaborators.length})</Label>
                      <div className="mt-2 space-y-1">
                        {selectedCollaborators.map((collaborator) => (
                          <div key={collaborator.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium">{collaborator.name}</span>
                              <Badge variant="outline" className="text-xs ml-2">
                                {collaborator.role === 'teacher' ? 'Giảng viên' : 'Trợ giảng'}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCollaborator(collaborator.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/teacher")}>
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo Lịch Học"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}