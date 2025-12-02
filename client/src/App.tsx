import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute, { 
  AdminRoute, 
  TeacherRoute, 
  StudentRoute, 
  TeacherOrAdminRoute,
  PublicRoute
} from "./components/ProtectedRoute";
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
import StudentSubmissions from "./pages/StudentSubmissions";
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
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={
                <PublicRoute>
                  <Dashboard />
                </PublicRoute>
              } />
              <Route path="/auth" element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              } />
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/choose-role" element={
                <PublicRoute>
                  <ChooseRole />
                </PublicRoute>
              } />

              {/* Protected routes requiring authentication */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/classroom" element={
                <ProtectedRoute>
                  <Classroom />
                </ProtectedRoute>
              } />

              {/* Admin-only routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* Teacher-only routes */}
              <Route path="/teacher" element={
                <TeacherRoute>
                  <TeacherDashboard />
                </TeacherRoute>
              } />
              <Route path="/teacher/create-course" element={
                <TeacherOrAdminRoute>
                  <CreateCourse />
                </TeacherOrAdminRoute>
              } />
              <Route path="/teacher/create-assignment" element={
                <TeacherRoute>
                  <CreateAssignment />
                </TeacherRoute>
              } />
              <Route path="/teacher/grading" element={
                <TeacherRoute>
                  <TeacherGrading />
                </TeacherRoute>
              } />

              {/* Student-only routes */}
              <Route path="/student" element={
                <StudentRoute>
                  <StudentPortal />
                </StudentRoute>
              } />
              <Route path="/student/assignments" element={
                <StudentRoute>
                  <StudentAssignments />
                </StudentRoute>
              } />
              <Route path="/student/submissions" element={
                <StudentRoute>
                  <StudentSubmissions />
                </StudentRoute>
              } />
              <Route path="/student/assignment/:homeworkId" element={
                <StudentRoute>
                  <AssignmentSubmission />
                </StudentRoute>
              } />

              {/* Course details - accessible by teachers and students */}
              <Route path="/course/:courseId" element={
                <ProtectedRoute requiredRole={['teacher', 'student']}>
                  <CourseDetail />
                </ProtectedRoute>
              } />

              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
