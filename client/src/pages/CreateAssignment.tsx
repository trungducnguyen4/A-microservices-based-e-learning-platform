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
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => navigate("/teacher")}>
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">Create New Assignment</h1>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="title" className="text-sm sm:text-base">Assignment Title *</Label>
                <Input
                  className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter assignment title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="course" className="text-sm sm:text-base">Course *</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData({...formData, courseId: value})}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base mt-1.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-2">
                <div>
                  <Label htmlFor="assignmentType" className="text-sm sm:text-base">Type</Label>
                  <Select value={formData.assignmentType} onValueChange={(value: any) => setFormData({...formData, assignmentType: value})}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Exercise">Exercise</SelectItem>
                        
                        <SelectItem value="Question">Question</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="topic" className="text-sm sm:text-base">Topic</Label>
                  <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional topic" />
                </div>

                <div>
                  <Label htmlFor="assignTo" className="text-sm sm:text-base">Assign To</Label>
                  <Select value={assignTo} onValueChange={(v: any) => setAssignTo(v)}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base mt-1.5">
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
                  <Label htmlFor="specificStudentIds" className="text-sm sm:text-base">Student IDs (comma-separated)</Label>
                  <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" id="specificStudentIds" value={specificStudentIds} onChange={(e) => setSpecificStudentIds(e.target.value)} placeholder="e.g. id1,id2" />
                </div>
              )}

            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
              <Textarea
                className="text-sm sm:text-base mt-1.5"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the assignment"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instructions" className="text-sm sm:text-base">Detailed Instructions</Label>
              <Textarea
                className="text-sm sm:text-base mt-1.5"
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              Assignment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="maxScore" className="text-sm sm:text-base">Max Score *</Label>
                <Input
                  className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                  id="maxScore"
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({...formData, maxScore: e.target.value})}
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimatedDuration" className="text-sm sm:text-base">Estimated Duration (minutes)</Label>
                <Input
                  className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDurationMinutes}
                  onChange={(e) => setFormData({...formData, estimatedDurationMinutes: e.target.value})}
                  placeholder="60"
                />
              </div>

              <div>
                <Label className="text-sm sm:text-base">Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9 sm:h-10 text-sm sm:text-base mt-1.5">
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="submissionType" className="text-sm sm:text-base">Submission Type</Label>
                <Select value={formData.submissionType} onValueChange={(value: "TEXT" | "FILE" | "BOTH") => setFormData({...formData, submissionType: value})}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base mt-1.5">
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
                <Label htmlFor="maxAttempts" className="text-sm sm:text-base">Max Attempts</Label>
                <Input
                  className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                  id="maxAttempts"
                  type="number"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({...formData, maxAttempts: e.target.value})}
                  placeholder="3"
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-0">
                <div className="flex-1">
                  <Label htmlFor="allowLate" className="text-sm sm:text-base">Allow Late Submissions</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Students can submit after due date</p>
                </div>
                <Switch
                  id="allowLate"
                  checked={formData.allowLateSubmissions}
                  onCheckedChange={(checked) => setFormData({...formData, allowLateSubmissions: checked})}
                />
              </div>

              <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-0">
                <div className="flex-1">
                  <Label htmlFor="allowResubmission" className="text-sm sm:text-base">Allow Resubmission</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Students can resubmit their work</p>
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Question Bank / Multiple Choice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {questions.map((q, qi) => (
                  <div key={q.id} className="border rounded p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1 w-full">
                        <Label className="text-sm sm:text-base">Question {qi + 1}</Label>
                        <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" value={q.text} onChange={(e) => updateQuestion(q.id, 'text', e.target.value)} placeholder="Enter question text" />
                      </div>
                      <div className="sm:ml-4 flex flex-row sm:flex-col items-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => removeQuestion(q.id)}>
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3">
                      <Label className="text-sm sm:text-base">Options</Label>
                      <div className="space-y-2 mt-1.5 sm:mt-2">
                        {q.options.map((opt: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                            <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === idx} onChange={() => updateQuestion(q.id, 'correctIndex', idx)} className="flex-shrink-0" />
                            <Input className="h-9 sm:h-10 text-sm sm:text-base" value={opt} onChange={(e) => updateQuestionOption(q.id, idx, e.target.value)} placeholder={`Option ${idx + 1}`} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0" onClick={() => removeOptionFromQuestion(q.id, idx)}>
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        ))}

                        <div className="mt-2">
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={() => addOptionToQuestion(q.id)}>Add Option</Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm sm:text-base">Points</Label>
                        <Input className="h-9 sm:h-10 text-sm sm:text-base mt-1.5" type="number" value={q.points} onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value || '0'))} />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Button className="text-sm sm:text-base h-9 sm:h-10" onClick={addQuestion}>Add Question</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Configuration */}
        {(formData.submissionType === 'FILE' || formData.submissionType === 'BOTH') && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                File Upload Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="maxFileSize" className="text-sm sm:text-base">Max File Size (MB)</Label>
                  <Input
                    className="h-9 sm:h-10 text-sm sm:text-base mt-1.5"
                    id="maxFileSize"
                    type="number"
                    value={formData.maxFileSizeMB}
                    onChange={(e) => setFormData({...formData, maxFileSizeMB: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm sm:text-base">Allowed File Types</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-2">
                  {fileTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type.value}
                        checked={formData.allowedFileTypes.includes(type.value)}
                        onChange={() => toggleFileType(type.value)}
                        className="flex-shrink-0"
                      />
                      <Label htmlFor={type.value} className="text-xs sm:text-sm cursor-pointer">{type.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

            

        {/* Teacher File Attachments */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Assignment Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">Drop files here or</p>
              <Button 
                type="button" 
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-8 sm:h-9"
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
              <div className="mt-3 sm:mt-4 space-y-2">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{file.originalName}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => removeAttachment(file.id)}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/teacher")}
            disabled={isLoading}
            className="h-9 sm:h-10 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
            Save as Draft
          </Button>
          <Button 
            type="button" 
            onClick={() => handleSubmit(false)}
            disabled={isLoading}
            className="min-w-[140px] sm:min-w-32 flex items-center justify-center gap-2 h-9 sm:h-10 text-sm sm:text-base"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            {isLoading ? 'Publishing...' : 'Publish Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );
}