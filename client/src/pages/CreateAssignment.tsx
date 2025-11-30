import { useState, useEffect } from "react";
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
import { homeworkService, fileService, api, type HomeworkCreationRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CreateAssignment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dueDate, setDueDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    courseId: "",
    classId: "",
    maxScore: "",
    estimatedDurationMinutes: "",
    submissionType: "BOTH" as "TEXT" | "FILE" | "BOTH",
    assignmentType: "Exercise" as "Exercise" | "Question",
    allowLateSubmissions: false,
    resubmissionAllowed: false,
    maxAttempts: "3",
    maxFileSizeMB: "10",
    allowedFileTypes: [] as string[],
  });

  const [topic, setTopic] = useState<string>("");
  const [assignTo, setAssignTo] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [specificStudentIds, setSpecificStudentIds] = useState<string>('');
  const [visibilityPublic, setVisibilityPublic] = useState<boolean>(false);

  // Courses (schedules) created by the current teacher
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);

  // Load teacher-owned schedules to populate the course select
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await api.get('/schedules/my-owned');
        const items = res.data?.result || [];
        // Debug log raw response
        // eslint-disable-next-line no-console
        console.log('schedules/my-owned response items:', items);

        const mapped = items.map((s: any) => {
          const id = s.courseId || s.id || (s.course && (s.course.courseId || s.course.id));
          const name = s.title || s.name || (s.course && (s.course.title || s.course.name));
          return { id: id ? id.toString() : null, name: name || (id ? id.toString() : '') };
        })
        // filter out any entries that don't have a usable id (Select requires non-empty value)
        .filter((m: any) => m.id && m.id.toString().trim() !== '');

        // Debug mapped (only non-empty ids)
        // eslint-disable-next-line no-console
        console.log('mapped courses for CreateAssignment (filtered):', mapped);

        setCourses(mapped as { id: string; name: string }[]);

        // If teacher has only one course, auto-select it
        if (mapped.length === 1 && (!formData.courseId || formData.courseId === '')) {
          setFormData(prev => ({ ...prev, courseId: (mapped[0].id as string) }));
        }
      } catch (error: any) {
        toast({ title: 'Failed to load courses', description: error.response?.data?.message || 'Could not load your courses', variant: 'destructive' });
      }
    };

    loadCourses();
  }, []);

  const fileTypes = [
    { value: "application/pdf", label: "PDF" },
    { value: "image/jpeg", label: "JPEG" },
    { value: "image/png", label: "PNG" },
    { value: "text/plain", label: "Text" },
    { value: "application/msword", label: "Word" },
    { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word (DOCX)" },
  ];
              <div className="flex items-center justify-between mt-4">
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <p className="text-sm text-muted-foreground">Public makes the assignment visible to anyone with the link</p>
                </div>
                <div>
                  <Switch id="visibility" checked={visibilityPublic} onCheckedChange={(v) => setVisibilityPublic(!!v)} />
                </div>
              </div>

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsLoading(true);
    try {
      const uploadedFiles = await Promise.all(
        Array.from(files).map(file => fileService.uploadFile(file, { type: 'assignments' }))
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

  

  const toggleFileType = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(type => type !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }));
  };

  const handleSubmit = async (asDraft = false) => {
    const missing: string[] = [];
    if (!formData.title || formData.title.trim() === '') missing.push('Title');
    if (!formData.courseId || formData.courseId.toString().trim() === '') missing.push('Course');
    if (!dueDate) missing.push('Due date');

    if (missing.length > 0) {
      // log current values for debugging
      // eslint-disable-next-line no-console
      console.log('CreateAssignment submit blocked — values:', { formData, dueDate });
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${missing.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const homeworkData: HomeworkCreationRequest = {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        // attach extra metadata
        // assignmentType and topic are additional fields consumed by HomeworkService
        // they will be ignored if backend doesn't support them
        // server-side should validate/strip unknown fields
        // classId is optional
        classId: formData.classId || undefined,
        // custom fields
        // @ts-ignore
        assignmentType: formData.assignmentType,
        // @ts-ignore
        topic: topic || undefined,
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
        // tags removed — accept all types by default; frontend will only send allowedFileTypes when user sets them
      };

      // If this is a Question-type assignment, include the questions payload
      if (formData.assignmentType === 'Question') {
        // Map our question structure to a backend-friendly format
        // Example shape: { text, options: string[], correctIndex, points }
        // @ts-ignore
        homeworkData.questions = questions.map(q => ({
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          points: q.points,
        }));
      }

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

  const addQuestion = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQ = { id: nextId, text: '', options: ['',''], correctIndex: 0, points: 1 };
    setQuestions(prev => [...prev, newQ]);
  };

  const addOptionToQuestion = (questionId: number) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, options: [...q.options, ''] } : q));
  };

  const removeOptionFromQuestion = (questionId: number, optionIndex: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const opts = q.options.filter((_: any, idx: number) => idx !== optionIndex);
      const correctIndex = q.correctIndex >= opts.length ? Math.max(0, opts.length - 1) : q.correctIndex;
      return { ...q, options: opts, correctIndex };
    }));
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="assignmentType">Type</Label>
                  <Select value={formData.assignmentType} onValueChange={(value: any) => setFormData({...formData, assignmentType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Exercise">Exercise</SelectItem>
                        
                        <SelectItem value="Question">Question</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional topic" />
                </div>

                <div>
                  <Label htmlFor="assignTo">Assign To</Label>
                  <Select value={assignTo} onValueChange={(v: any) => setAssignTo(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={'ALL'}>All students</SelectItem>
                      <SelectItem value={'SPECIFIC'}>Specific students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {assignTo === 'SPECIFIC' && (
                <div className="mt-2">
                  <Label htmlFor="specificStudentIds">Student IDs (comma-separated)</Label>
                  <Input id="specificStudentIds" value={specificStudentIds} onChange={(e) => setSpecificStudentIds(e.target.value)} placeholder="e.g. id1,id2" />
                </div>
              )}

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

        {/* Question builder (visible when Type = Question) */}
        {formData.assignmentType === 'Question' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Question Bank / Multiple Choice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div key={q.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Label>Question {qi + 1}</Label>
                        <Input value={q.text} onChange={(e) => updateQuestion(q.id, 'text', e.target.value)} placeholder="Enter question text" />
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label>Options</Label>
                      <div className="space-y-2 mt-2">
                        {q.options.map((opt: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === idx} onChange={() => updateQuestion(q.id, 'correctIndex', idx)} />
                            <Input value={opt} onChange={(e) => updateQuestionOption(q.id, idx, e.target.value)} placeholder={`Option ${idx + 1}`} />
                            <Button variant="ghost" size="icon" onClick={() => removeOptionFromQuestion(q.id, idx)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        <div className="mt-2">
                          <Button variant="outline" onClick={() => addOptionToQuestion(q.id)}>Add Option</Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <Label>Points</Label>
                        <Input type="number" value={q.points} onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value || '0'))} />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Button onClick={addQuestion}>Add Question</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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