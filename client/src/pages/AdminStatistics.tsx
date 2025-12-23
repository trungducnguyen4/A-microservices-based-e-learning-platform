import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, TrendingUp, TrendingDown, Users, BookOpen, Target } from "lucide-react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ReportData {
  title: string;
  metric: string;
  value: number;
  change: number;
  trend: string;
}

interface TimeSeriesData {
  date: string;
  enrollments: number;
  completions: number;
  revenue: number;
}

const AdminStatistics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(false);

  const reports: ReportData[] = [
    {
      title: "Student Engagement",
      metric: "Daily Active Users",
      value: 1240,
      change: 12.5,
      trend: "up",
    },
    {
      title: "Course Completion",
      metric: "Courses Completed",
      value: 342,
      change: 8.3,
      trend: "up",
    },
    {
      title: "Revenue Growth",
      metric: "Total Revenue",
      value: 145230,
      change: -2.1,
      trend: "down",
    },
    {
      title: "System Health",
      metric: "Uptime Percentage",
      value: 99.98,
      change: 0.02,
      trend: "up",
    },
  ];

  const timeSeriesData: TimeSeriesData[] = [
    { date: "Dec 16", enrollments: 240, completions: 82, revenue: 2400 },
    { date: "Dec 17", enrollments: 320, completions: 95, revenue: 2600 },
    { date: "Dec 18", enrollments: 280, completions: 78, revenue: 2200 },
    { date: "Dec 19", enrollments: 450, completions: 112, revenue: 3100 },
    { date: "Dec 20", enrollments: 380, completions: 98, revenue: 2800 },
    { date: "Dec 21", enrollments: 520, completions: 145, revenue: 3500 },
    { date: "Dec 22", enrollments: 610, completions: 168, revenue: 4200 },
  ];

  const categoryStats = [
    { category: "Programming", courses: 18, students: 2450, revenue: 45230 },
    { category: "Design", courses: 12, students: 1820, revenue: 32540 },
    { category: "Business", courses: 10, students: 1340, revenue: 28760 },
    { category: "Languages", courses: 8, students: 980, revenue: 19870 },
  ];

  const topPerformers = [
    { name: "React Advanced Course", views: 3240, enrollments: 245, revenue: 12345 },
    { name: "Python for Beginners", views: 4120, enrollments: 428, revenue: 21392 },
    { name: "Web Design Masterclass", views: 2890, enrollments: 189, revenue: 15111 },
    { name: "Data Science 101", views: 3560, enrollments: 312, revenue: 37440 },
  ];

  const handleExportReport = (format: string) => {
    // Export logic would go here
    console.log(`Exporting ${format} report...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Statistics & Reports</h1>
          <p className="text-slate-400">System analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            {["7d", "30d", "90d", "1y"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="border-slate-600"
              >
                {range === "7d"
                  ? "Last 7 Days"
                  : range === "30d"
                    ? "Last 30 Days"
                    : range === "90d"
                      ? "Last 90 Days"
                      : "Last Year"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report, idx) => (
          <Card key={idx} className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-400">{report.title}</p>
                <p className="text-2xl font-bold text-white">{report.value.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  {report.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${report.trend === "up" ? "text-green-400" : "text-red-400"}`}
                  >
                    {report.change > 0 ? "+" : ""}{report.change}%
                  </span>
                  <span className="text-xs text-slate-500">{report.metric}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment & Completion Trend */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Enrollment & Completion</CardTitle>
            <CardDescription>Daily activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="enrollments"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Enrollments"
                />
                <Area
                  type="monotone"
                  dataKey="completions"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Completions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed reports */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Detailed Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="bg-slate-700">
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="performers">Top Performers</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
            </TabsList>

            {/* By Category */}
            <TabsContent value="categories" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-slate-700">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-slate-300">Category</TableHead>
                      <TableHead className="text-slate-300 text-right">Courses</TableHead>
                      <TableHead className="text-slate-300 text-right">Students</TableHead>
                      <TableHead className="text-slate-300 text-right">Revenue</TableHead>
                      <TableHead className="text-slate-300 text-right">Avg Revenue/Course</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryStats.map((stat, idx) => (
                      <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">{stat.category}</TableCell>
                        <TableCell className="text-right text-slate-300">{stat.courses}</TableCell>
                        <TableCell className="text-right text-slate-300">{stat.students}</TableCell>
                        <TableCell className="text-right text-white font-medium">${stat.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-slate-300">
                          ${(stat.revenue / stat.courses).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Top Performers */}
            <TabsContent value="performers" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-slate-700">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-slate-300">Course</TableHead>
                      <TableHead className="text-slate-300 text-right">Views</TableHead>
                      <TableHead className="text-slate-300 text-right">Enrollments</TableHead>
                      <TableHead className="text-slate-300 text-right">Revenue</TableHead>
                      <TableHead className="text-slate-300 text-right">Conv. Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPerformers.map((course, idx) => (
                      <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-white font-medium">{course.name}</TableCell>
                        <TableCell className="text-right text-slate-300">{course.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-slate-300">{course.enrollments}</TableCell>
                        <TableCell className="text-right text-white font-medium">${course.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-500/20 text-green-400">
                            {((course.enrollments / course.views) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Demographics */}
            <TabsContent value="demographics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">User Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300">Students</span>
                          <span className="text-sm font-bold text-white">65%</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[65%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300">Instructors</span>
                          <span className="text-sm font-bold text-white">30%</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[30%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300">Admins</span>
                          <span className="text-sm font-bold text-white">5%</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 w-[5%]" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300">Daily Active</span>
                          <span className="text-sm font-bold text-white">45%</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-[45%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300">Weekly Active</span>
                          <span className="text-sm font-bold text-white">72%</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 w-[72%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300">Monthly Active</span>
                          <span className="text-sm font-bold text-white">88%</span>
                        </div>
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 w-[88%]" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatistics;
