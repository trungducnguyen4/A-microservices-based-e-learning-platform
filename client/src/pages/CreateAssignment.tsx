import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Calendar as CalendarIcon, Clock, FileText, Settings, Upload, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [dueDate, setDueDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    courseId: "",
    maxPoints: "",
    timeLimit: "",
    allowLateSubmission: false,
    allowMultipleAttempts: false,
    showCorrectAnswers: false
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Mock courses data
  const courses = [
    { id: "1", name: "React và TypeScript Cơ Bản" },
    { id: "2", name: "JavaScript ES6+" },
    { id: "3", name: "Node.js Backend" },
  ];

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: "multiple-choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: number) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: number, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const updateQuestionOption = (questionId: number, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt: string, idx: number) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Assignment created:", { 
      ...formData, 
      dueDate, 
      questions, 
      attachments 
    });
    navigate("/teacher");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">Tạo Bài Tập Mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Thông Tin Cơ Bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Tiêu Đề Bài Tập</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Nhập tiêu đề bài tập"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="course">Khóa Học</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData({...formData, courseId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khóa học" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô Tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả ngắn gọn về bài tập"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="instructions">Hướng Dẫn Chi Tiết</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                placeholder="Hướng dẫn chi tiết cách làm bài tập"
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cài Đặt Bài Tập
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxPoints">Điểm Tối Đa</Label>
                <Input
                  id="maxPoints"
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) => setFormData({...formData, maxPoints: e.target.value})}
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="timeLimit">Thời Gian Làm Bài (phút)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({...formData, timeLimit: e.target.value})}
                  placeholder="60"
                />
              </div>

              <div>
                <Label>Hạn Nộp</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: vi }) : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowLate">Cho Phép Nộp Trễ</Label>
                  <p className="text-sm text-muted-foreground">Học sinh có thể nộp bài sau hạn</p>
                </div>
                <Switch
                  id="allowLate"
                  checked={formData.allowLateSubmission}
                  onCheckedChange={(checked) => setFormData({...formData, allowLateSubmission: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowMultiple">Cho Phép Làm Lại</Label>
                  <p className="text-sm text-muted-foreground">Học sinh có thể làm bài nhiều lần</p>
                </div>
                <Switch
                  id="allowMultiple"
                  checked={formData.allowMultipleAttempts}
                  onCheckedChange={(checked) => setFormData({...formData, allowMultipleAttempts: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showAnswers">Hiển Thị Đáp Án</Label>
                  <p className="text-sm text-muted-foreground">Hiển thị đáp án đúng sau khi nộp bài</p>
                </div>
                <Switch
                  id="showAnswers"
                  checked={formData.showCorrectAnswers}
                  onCheckedChange={(checked) => setFormData({...formData, showCorrectAnswers: checked})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Câu Hỏi ({questions.length})</CardTitle>
            <Button type="button" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Câu Hỏi
            </Button>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có câu hỏi nào. Nhấn "Thêm Câu Hỏi" để bắt đầu.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Câu {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Loại Câu Hỏi</Label>
                          <Select
                            value={question.type}
                            onValueChange={(value) => updateQuestion(question.id, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple-choice">Trắc nghiệm</SelectItem>
                              <SelectItem value="true-false">Đúng/Sai</SelectItem>
                              <SelectItem value="short-answer">Tự luận ngắn</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Điểm</Label>
                          <Input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, "points", parseInt(e.target.value))}
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Câu Hỏi</Label>
                        <Textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                          placeholder="Nhập câu hỏi..."
                          rows={2}
                        />
                      </div>

                      {question.type === "multiple-choice" && (
                        <div>
                          <Label>Các Lựa Chọn</Label>
                          <div className="space-y-2">
                            {question.options.map((option: string, optionIndex: number) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={question.correctAnswer === optionIndex}
                                  onChange={() => updateQuestion(question.id, "correctAnswer", optionIndex)}
                                />
                                <Input
                                  value={option}
                                  onChange={(e) => updateQuestionOption(question.id, optionIndex, e.target.value)}
                                  placeholder={`Lựa chọn ${optionIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Tệp Đính Kèm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Kéo thả tệp vào đây hoặc</p>
              <Button type="button" variant="outline">
                Chọn Tệp
              </Button>
            </div>
            
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/teacher")}>
            Hủy
          </Button>
          <Button type="button" variant="secondary">
            Lưu Nháp
          </Button>
          <Button type="submit" className="min-w-32">
            Tạo Bài Tập
          </Button>
        </div>
      </form>
    </div>
  );
}