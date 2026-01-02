import { useState, useEffect } from "react";
import { adminService } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  Calendar,
  AlertCircle,
  Activity,
  Trophy,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  completionRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  courseTrend: Array<{ month: string; courses: number }>;
  userTrend: Array<{ month: string; users: number }>;
  courseDistribution: Array<{ name: string; value: number }>;
  topInstructors: Array<{ name: string; courses: number; students: number; rating: number }>;
  recentActivities: Array<{ id: string; type: string; description: string; timestamp: string }>;
}

const AdminDashboardHome = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const summary = await adminService.summary();

        // Map minimal summary payload to dashboard view; optional fields default to safe values
        const built: DashboardStats = {
          totalUsers: summary?.totalUsers ?? 0,
          activeUsers: summary?.activeUsers ?? summary?.totalUsers ?? 0,
          totalCourses: summary?.totalCourses ?? 0,
          activeCourses: summary?.activeCourses ?? summary?.totalCourses ?? 0,
          totalEnrollments: summary?.totalEnrollments ?? 0,
          completionRate: summary?.completionRate ?? 0,
          totalRevenue: summary?.totalRevenue ?? 0,
          monthlyRevenue: summary?.monthlyRevenue ?? 0,
          courseTrend: summary?.courseTrend ?? [],
          userTrend: summary?.userTrend ?? [],
          courseDistribution: summary?.courseDistribution ?? [],
          topInstructors: summary?.topInstructors ?? [],
          recentActivities: summary?.recentActivities ?? [],
        };

        setStats(built);
        setError(null);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load statistics from AdminService");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
        <AlertCircle className="w-5 h-5 inline mr-2" />
        {error}
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Tổng Người Dùng",
            value: stats?.totalUsers || 0,
            change: "+12.5%",
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-500/20",
          },
          {
            title: "Khóa Học Đang Hoạt",
            value: stats?.activeCourses || 0,
            change: "+3.2%",
            icon: BookOpen,
            color: "text-green-500",
            bgColor: "bg-green-500/20",
          },
          {
            title: "Tỷ Lệ Hoàn Thành",
            value: `${stats?.completionRate || 0}%`,
            change: "+2.4%",
            icon: TrendingUp,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/20",
          },
          {
            title: "Doanh Thu Tháng",
            value: `$${stats?.monthlyRevenue || 0}`,
            change: "+8.1%",
            icon: BarChart3,
            color: "text-purple-500",
            bgColor: "bg-purple-500/20",
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-green-400 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Trend */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Xu Hướng Khóa Học</CardTitle>
            <CardDescription>Số lượng khóa học được tạo theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.courseTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="courses"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Tăng Trưởng Người Dùng</CardTitle>
            <CardDescription>Số lượng người dùng mới đăng ký</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.userTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="users" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Phân Phối Khóa Học</CardTitle>
            <CardDescription>Khóa học theo danh mục</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.courseDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Chỉ Số Chính</CardTitle>
            <CardDescription>Các thống kê quan trọng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Tỷ Lệ Kích Hoạt Người Dùng</span>
                <span className="text-sm font-bold text-white">
                  {((stats?.activeUsers || 0) / (stats?.totalUsers || 1) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(stats?.activeUsers || 0) / (stats?.totalUsers || 1) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Khóa Học Hoạt Động</span>
                <span className="text-sm font-bold text-white">
                  {((stats?.activeCourses || 0) / (stats?.totalCourses || 1) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(stats?.activeCourses || 0) / (stats?.totalCourses || 1) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Tỷ Lệ Hoàn Thành Khóa Học</span>
                <span className="text-sm font-bold text-white">{stats?.completionRate || 0}%</span>
              </div>
              <Progress value={stats?.completionRate || 0} className="h-2" />
            </div>

            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400">Tổng Doanh Thu: <span className="text-white font-bold">${stats?.totalRevenue || 0}</span></p>
              <p className="text-xs text-slate-400">Tổng Ghi Danh: <span className="text-white font-bold">{stats?.totalEnrollments || 0}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Instructors & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Instructors */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Giáo Viên Hàng Đầu
            </CardTitle>
            <CardDescription>Các giáo viên có hiệu suất tốt nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats?.topInstructors || []).map((instructor, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{instructor.name}</p>
                    <p className="text-xs text-slate-400">{instructor.courses} khóa • {instructor.students} học viên</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-600">
                    ⭐ {instructor.rating}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Hoạt Động Gần Đây
            </CardTitle>
            <CardDescription>Các sự kiện trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.recentActivities || []).map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm text-slate-300 p-2 hover:bg-slate-700/30 rounded transition">
                  <div className="flex-1">
                    <p className="text-white">{activity.description}</p>
                    <p className="text-xs text-slate-500">{activity.timestamp}</p>
                  </div>
                  <Badge variant="secondary" className="h-fit text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
