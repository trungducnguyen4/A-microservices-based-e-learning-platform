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
import { ArrowLeft, Calendar as CalendarIcon, Clock, FileText, Settings, Upload, Plus, X, Save, Send } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { homeworkService, fileService, type HomeworkCreationRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CreateAssignment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dueDate, setDueDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    courseId: "",
    classId: "",
    maxScore: "",
    estimatedDurationMinutes: "",
    submissionType: "BOTH" as "TEXT" | "FILE" | "BOTH",
    allowLateSubmissions: false,
    resubmissionAllowed: false,
    maxAttempts: "3",
    maxFileSizeMB: "10",
    allowedFileTypes: [] as string[],
    tags: [] as string[],
  });

  // Mock courses data - replace with real API call
  const courses = [
    { id: "1", name: "React và TypeScript Cơ Bản" },
    { id: "2", name: "JavaScript ES6+" },
    { id: "3", name: "Node.js Backend" },
  ];

  const fileTypes = [
    { value: "application/pdf", label: "PDF" },
    { value: "image/jpeg", label: "JPEG" },
    { value: "image/png", label: "PNG" },
    { value: "text/plain", label: "Text" },
    { value: "application/msword", label: "Word" },
    { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word (DOCX)" },
  ];

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsLoading(true);
    try {
      const uploadedFiles = await Promise.all(
        Array.from(files).map(file => fileService.uploadFile(file, { type: 'homework-attachment' }))
      );
      
      setAttachments(prev => [...prev, ...uploadedFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${uploadedFiles.length} file(s) uploaded`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = (fileId: string) => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const toggleFileType = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(type => type !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }));
  };

  const handleSubmit = async (asDraft = false) => {
    if (!formData.title || !formData.courseId || !dueDate) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, course, and due date.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const homeworkData: HomeworkCreationRequest = {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        classId: formData.classId || undefined,
        dueDate: dueDate.toISOString(),
        maxScore: parseFloat(formData.maxScore) || 100,
        submissionType: formData.submissionType,
        instructions: formData.instructions,
        allowLateSubmissions: formData.allowLateSubmissions,
        resubmissionAllowed: formData.resubmissionAllowed,
        maxAttempts: parseInt(formData.maxAttempts) || 3,
        estimatedDurationMinutes: parseInt(formData.estimatedDurationMinutes) || undefined,
        allowedFileTypes: formData.allowedFileTypes.length > 0 ? formData.allowedFileTypes : undefined,
        maxFileSizeMB: parseInt(formData.maxFileSizeMB) || 10,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      const result = await homeworkService.createHomework(homeworkData);
      
      // If not saving as draft, publish immediately
      if (!asDraft) {
        await homeworkService.publishHomework(result.result.id);
      }

      toast({
        title: asDraft ? "Homework saved as draft" : "Homework published successfully",
        description: `Assignment "${formData.title}" has been ${asDraft ? 'saved' : 'published'}.`,
      });

      navigate('/teacher');
    } catch (error: any) {
      toast({
        title: "Failed to create homework",
        description: error.response?.data?.message || "An error occurred while creating the assignment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">Create New Assignment</h1>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter assignment title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData({...formData, courseId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the assignment"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Detailed Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                placeholder="Detailed instructions for completing the assignment"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assignment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maxScore">Max Score *</Label>
                <Input
                  id="maxScore"
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({...formData, maxScore: e.target.value})}
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDurationMinutes}
                  onChange={(e) => setFormData({...formData, estimatedDurationMinutes: e.target.value})}
                  placeholder="60"
                />
              </div>

              <div>
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select date"}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="submissionType">Submission Type</Label>
                <Select value={formData.submissionType} onValueChange={(value: "TEXT" | "FILE" | "BOTH") => setFormData({...formData, submissionType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text Only</SelectItem>
                    <SelectItem value="FILE">File Only</SelectItem>
                    <SelectItem value="BOTH">Text & File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({...formData, maxAttempts: e.target.value})}
                  placeholder="3"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowLate">Allow Late Submissions</Label>
                  <p className="text-sm text-muted-foreground">Students can submit after due date</p>
                </div>
                <Switch
                  id="allowLate"
                  checked={formData.allowLateSubmissions}
                  onCheckedChange={(checked) => setFormData({...formData, allowLateSubmissions: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowResubmission">Allow Resubmission</Label>
                  <p className="text-sm text-muted-foreground">Students can resubmit their work</p>
                </div>
                <Switch
                  id="allowResubmission"
                  checked={formData.resubmissionAllowed}
                  onCheckedChange={(checked) => setFormData({...formData, resubmissionAllowed: checked})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Configuration */}
        {(formData.submissionType === 'FILE' || formData.submissionType === 'BOTH') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={formData.maxFileSizeMB}
                    onChange={(e) => setFormData({...formData, maxFileSizeMB: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <Label>Allowed File Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {fileTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type.value}
                        checked={formData.allowedFileTypes.includes(type.value)}
                        onChange={() => toggleFileType(type.value)}
                      />
                      <Label htmlFor={type.value} className="text-sm">{type.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                  if (input?.value) {
                    addTag(input.value);
                    input.value = '';
                  }
                }}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teacher File Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Assignment Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Drop files here or</p>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Choose Files'}
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
            
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.originalName}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(file.id)}
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
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/teacher")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button 
            type="button" 
            onClick={() => handleSubmit(false)}
            disabled={isLoading}
            className="min-w-32 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isLoading ? 'Publishing...' : 'Publish Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );
}