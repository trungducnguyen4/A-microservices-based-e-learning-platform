import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Download,
  Calendar,
  Clock,
  Star
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = [
    { title: "Total Students", value: "2,547", change: "+12.5%", icon: Users, color: "text-primary" },
    { title: "Active Courses", value: "48", change: "+3.2%", icon: BookOpen, color: "text-success" },
    { title: "Revenue", value: "$42,590", change: "+8.1%", icon: DollarSign, color: "text-warning" },
    { title: "Completion Rate", value: "87.3%", change: "+2.4%", icon: TrendingUp, color: "text-info" },
  ];

  const courses = [
    { 
      id: 1, 
      title: "Advanced React Development", 
      instructor: "John Doe", 
      students: 145, 
      revenue: "$4,350", 
      rating: 4.8,
      status: "Active",
      progress: 75
    },
    { 
      id: 2, 
      title: "Python for Data Science", 
      instructor: "Jane Smith", 
      students: 98, 
      revenue: "$2,940", 
      rating: 4.6,
      status: "Active",
      progress: 60
    },
    { 
      id: 3, 
      title: "UX/UI Design Fundamentals", 
      instructor: "Mike Johnson", 
      students: 67, 
      revenue: "$2,010", 
      rating: 4.9,
      status: "Draft",
      progress: 90
    },
  ];

  const students = [
    { 
      id: 1, 
      name: "Alice Cooper", 
      email: "alice@example.com", 
      courses: 3, 
      progress: 85,
      joined: "2024-01-15",
      status: "Active"
    },
    { 
      id: 2, 
      name: "Bob Wilson", 
      email: "bob@example.com", 
      courses: 2, 
      progress: 72,
      joined: "2024-02-03",
      status: "Active"
    },
    { 
      id: 3, 
      name: "Carol Brown", 
      email: "carol@example.com", 
      courses: 4, 
      progress: 94,
      joined: "2024-01-08",
      status: "Inactive"
    },
  ];

  const instructors = [
    { 
      id: 1, 
      name: "John Doe", 
      email: "john@example.com", 
      courses: 5, 
      students: 342,
      rating: 4.8,
      revenue: "$12,450",
      status: "Active"
    },
    { 
      id: 2, 
      name: "Jane Smith", 
      email: "jane@example.com", 
      courses: 3, 
      students: 189,
      rating: 4.6,
      revenue: "$8,670",
      status: "Active"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your educational platform</p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Plus className="w-4 h-4 mr-2" />
            Add New Course
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-success">{stat.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>Manage and monitor all courses</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search courses..."
                      className="pl-10 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="font-medium">{course.title}</div>
                      </TableCell>
                      <TableCell>{course.instructor}</TableCell>
                      <TableCell>{course.students}</TableCell>
                      <TableCell>{course.revenue}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-warning mr-1" />
                          {course.rating}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.status === "Active" ? "default" : "secondary"}>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={course.progress} className="w-16" />
                          <span className="text-sm text-muted-foreground">{course.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Course
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>Monitor student progress and enrollment</CardDescription>
                </div>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.courses}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={student.progress} className="w-16" />
                          <span className="text-sm text-muted-foreground">{student.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.joined}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent value="instructors" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Instructor Management</CardTitle>
                  <CardDescription>Manage teaching staff and performance</CardDescription>
                </div>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Instructor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructors.map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{instructor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{instructor.name}</div>
                            <div className="text-sm text-muted-foreground">{instructor.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{instructor.courses}</TableCell>
                      <TableCell>{instructor.students}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-warning mr-1" />
                          {instructor.rating}
                        </div>
                      </TableCell>
                      <TableCell>{instructor.revenue}</TableCell>
                      <TableCell>
                        <Badge variant={instructor.status === "Active" ? "default" : "secondary"}>
                          {instructor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Instructor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;