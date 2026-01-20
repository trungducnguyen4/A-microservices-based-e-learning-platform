import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute, { 
  AdminRoute, 
  TeacherRoute, 
  StudentRoute, 
  TeacherOrAdminRoute,
  PublicRoute
} from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Classroom from "./pages/Classroom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboardHome from "./pages/AdminDashboardHome";
import AdminUsers from "./pages/AdminUsers";
import AdminCourses from "./pages/AdminCourses";
import AdminStatistics from "./pages/AdminStatistics";
import AdminSettings from "./pages/AdminSettings";
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
import MeetingHome from "./pages/MeetingHome";
import PreJoinScreen from "./pages/PreJoinScreen";
import ClassroomLayoutDemo from "./pages/ClassroomLayoutDemo";
import EditSchedulePage from "./pages/EditSchedulePage";
const queryClient = new QueryClient();

// Component to conditionally render Navigation
const AppContent = () => {
  const location = useLocation();
  const hideNavbar = ['/classroom', '/prejoin', '/login', '/register', '/auth', '/admin/login', '/choose-role'].includes(location.pathname);
  
  return (
    <div className="min-h-screen bg-background">
      {!hideNavbar && <Navigation />}
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
              <Route path="/meet" element={
                <ProtectedRoute>
                  <MeetingHome />
                </ProtectedRoute>
              } />
              <Route path="/prejoin" element={
                <ProtectedRoute>
                  <PreJoinScreen />
                </ProtectedRoute>
              } />
              <Route path="/classroom" element={
                <ProtectedRoute>
                  <Classroom />
                </ProtectedRoute>
              } />
              <Route path="/demo-layout" element={
                <ProtectedRoute>
                  <ClassroomLayoutDemo />
                </ProtectedRoute>
              } />

              {/* Admin routes - protected by AdminRoute */}
              <Route path="/admin/login" element={
                <PublicRoute>
                  <AdminLogin />
                </PublicRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboardHome />} />
                      <Route path="/users" element={<AdminUsers />} />
                      <Route path="/courses" element={<AdminCourses />} />
                      <Route path="/statistics" element={<AdminStatistics />} />
                      <Route path="/reports" element={<AdminStatistics />} />
                      <Route path="/settings" element={<AdminSettings />} />
                    </Routes>
                  </AdminLayout>
                </AdminRoute>
              } />
              {/* Fallback to old admin dashboard if accessed directly */}
              <Route path="/admin-old" element={
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
              <Route path="/teacher/edit-schedule/:scheduleId" element={
                <TeacherRoute>
                  <EditSchedulePage />
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
