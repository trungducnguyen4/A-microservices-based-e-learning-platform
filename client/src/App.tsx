import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Classroom from "./pages/Classroom";
import AdminDashboard from "./pages/AdminDashboard";
import StudentPortal from "./pages/StudentPortal";
import TeacherDashboard from "./pages/TeacherDashboard";
import CreateCourse from "./pages/CreateCourse";
import CreateAssignment from "./pages/CreateAssignment";
import AssignmentSubmission from "./pages/AssignmentSubmission";
import StudentAssignments from "./pages/StudentAssignments";
import TeacherGrading from "./pages/TeacherGrading";
import CourseDetail from "./pages/CourseDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import Profile from "./pages/Profile";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/create-course" element={<CreateCourse />} />
            <Route path="/teacher/create-assignment" element={<CreateAssignment />} />
            <Route path="/teacher/grading" element={<TeacherGrading />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/assignment/:homeworkId" element={<AssignmentSubmission />} />
            <Route path="/course/:courseId" element={<CourseDetail />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/choose-role" element={<ChooseRole />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
