import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search, UserPlus, X } from "lucide-react";

export default function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    maxStudents: ""
  });
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock students data
  const availableStudents = [
    { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@email.com", avatar: null },
    { id: 2, name: "Trần Thị B", email: "tranthib@email.com", avatar: null },
    { id: 3, name: "Lê Văn C", email: "levanc@email.com", avatar: null },
    { id: 4, name: "Phạm Thị D", email: "phamthid@email.com", avatar: null },
    { id: 5, name: "Hoàng Văn E", email: "hoangvane@email.com", avatar: null },
  ];

  const filteredStudents = availableStudents.filter(
    student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(student => !selectedStudents.find(s => s.id === student.id));

  const addStudent = (student: any) => {
    setSelectedStudents([...selectedStudents, student]);
  };

  const removeStudent = (studentId: number) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Course created:", { ...formData, students: selectedStudents });
    navigate("/teacher");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">Tạo Khóa Học Mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Khóa Học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Tên Khóa Học</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Nhập tên khóa học"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Mô Tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả khóa học"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Danh Mục</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Ví dụ: Lập trình, Toán học, Ngôn ngữ"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Thời Lượng (tuần)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxStudents">Số Học Sinh Tối Đa</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                    placeholder="30"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Thêm Học Sinh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Students */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm học sinh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Available Students */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addStudent(student)}>
                      Thêm
                    </Button>
                  </div>
                ))}
              </div>

              {/* Selected Students */}
              {selectedStudents.length > 0 && (
                <div>
                  <Label>Học Sinh Đã Chọn ({selectedStudents.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudents.map((student) => (
                      <Badge key={student.id} variant="secondary" className="flex items-center gap-1">
                        {student.name}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeStudent(student.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/teacher")}>
            Hủy
          </Button>
          <Button type="submit" className="min-w-32">
            Tạo Khóa Học
          </Button>
        </div>
      </form>
    </div>
  );
}