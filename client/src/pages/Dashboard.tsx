import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Users, 
  Video, 
  Clock, 
  TrendingUp, 
  Calendar,
  Play,
  MessageSquare,
  FileText,
  Award
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { 
      title: "Active Courses", 
      value: "12", 
      icon: BookOpen, 
      trend: "+2.5%", 
      color: "text-primary" 
    },
    { 
      title: "Total Students", 
      value: "1,284", 
      icon: Users, 
      trend: "+12.3%", 
      color: "text-success" 
    },
    { 
      title: "Live Sessions", 
      value: "8", 
      icon: Video, 
      trend: "+4.1%", 
      color: "text-warning" 
    },
    { 
      title: "Completion Rate", 
      value: "89%", 
      icon: TrendingUp, 
      trend: "+3.2%", 
      color: "text-info" 
    },
  ];

  const recentCourses = [
    { id: 1, title: "Advanced React Development", students: 45, progress: 75, instructor: "John Doe", nextClass: "Today 14:00" },
    { id: 2, title: "Python for Data Science", students: 32, progress: 60, instructor: "Jane Smith", nextClass: "Tomorrow 10:00" },
    { id: 3, title: "UX/UI Design Fundamentals", students: 28, progress: 90, instructor: "Mike Johnson", nextClass: "Today 16:30" },
  ];

  const upcomingClasses = [
    { id: 1, course: "Advanced React", time: "14:00", duration: "90 min", students: 45 },
    { id: 2, course: "Python Basics", time: "16:30", duration: "60 min", students: 32 },
    { id: 3, course: "UX Design", time: "18:00", duration: "120 min", students: 28 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <Button variant="outline" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </Button>
          <Link to="/classroom">
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-primary to-accent">
              <Video className="w-4 h-4" />
              <span>Start Live Class</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-success">
                  {stat.trend} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Recent Courses</span>
              </CardTitle>
              <CardDescription>
                Your most active courses this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {course.students} students • Instructor: {course.instructor}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Progress value={course.progress} className="flex-1 max-w-[100px]" />
                      <span className="text-xs text-muted-foreground">{course.progress}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {course.nextClass}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Play className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Classes */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-warning" />
                <span>Today's Classes</span>
              </CardTitle>
              <CardDescription>
                Your schedule for today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingClasses.map((class_) => (
                <div key={class_.id} className="p-3 rounded-lg border-l-4 border-l-primary bg-primary/5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{class_.course}</h4>
                    <Badge variant="outline" className="text-xs">
                      {class_.duration}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {class_.time} • {class_.students} students
                  </p>
                  <Button size="sm" className="w-full mt-2" variant="secondary">
                    <Video className="w-3 h-3 mr-1" />
                    Join Class
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Student Messages</h3>
            <p className="text-sm text-muted-foreground mt-1">Check and respond to student inquiries</p>
            <Button variant="ghost" className="mt-3 group-hover:bg-primary group-hover:text-primary-foreground">
              View Messages
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Course Materials</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload and manage course content</p>
            <Button variant="ghost" className="mt-3 group-hover:bg-success group-hover:text-success-foreground">
              Manage Files
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning/20 transition-colors">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Assessments</h3>
            <p className="text-sm text-muted-foreground mt-1">Create and grade student assignments</p>
            <Button variant="ghost" className="mt-3 group-hover:bg-warning group-hover:text-warning-foreground">
              View Grades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;