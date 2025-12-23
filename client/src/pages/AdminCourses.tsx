import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Edit, Trash2, Eye, Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  students: number;
  rating: number;
  status: string;
  createdAt: string;
  price: number;
  enrollmentTrend: number; // percentage
}

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Mock data
        const mockCourses: Course[] = [
          {
            id: "1",
            title: "Advanced React Development",
            instructor: "John Doe",
            category: "Programming",
            students: 245,
            rating: 4.8,
            status: "PUBLISHED",
            createdAt: "2025-01-15",
            price: 99.99,
            enrollmentTrend: 12.5,
          },
          {
            id: "2",
            title: "Web Design Fundamentals",
            instructor: "Jane Smith",
            category: "Design",
            students: 189,
            rating: 4.6,
            status: "PUBLISHED",
            createdAt: "2025-01-20",
            price: 79.99,
            enrollmentTrend: 8.3,
          },
          {
            id: "3",
            title: "Data Science Basics",
            instructor: "Mike Johnson",
            category: "Data Science",
            students: 312,
            rating: 4.7,
            status: "PUBLISHED",
            createdAt: "2025-02-01",
            price: 119.99,
            enrollmentTrend: 15.2,
          },
          {
            id: "4",
            title: "Python for Beginners",
            instructor: "Sarah Wilson",
            category: "Programming",
            students: 428,
            rating: 4.9,
            status: "PUBLISHED",
            createdAt: "2025-02-10",
            price: 49.99,
            enrollmentTrend: 22.1,
          },
          {
            id: "5",
            title: "Advanced TypeScript",
            instructor: "John Doe",
            category: "Programming",
            students: 156,
            rating: 4.5,
            status: "DRAFT",
            createdAt: "2025-03-01",
            price: 89.99,
            enrollmentTrend: 5.8,
          },
        ];

        setCourses(mockCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || course.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredCourses.length / pageSize);

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Course Management</h1>
          <p className="text-slate-400">Manage all courses in the system</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-white">{courses.length}</p>
              <p className="text-xs text-green-400 mt-1">
                {courses.filter((c) => c.status === "PUBLISHED").length} Published
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1">Total Students</p>
              <p className="text-3xl font-bold text-white">
                {courses.reduce((sum, c) => sum + c.students, 0)}
              </p>
              <p className="text-xs text-blue-400 mt-1">Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-white">
                {(courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(2)}
              </p>
              <p className="text-xs text-yellow-400 mt-1">⭐ Stars</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by course title or instructor..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <select
              value={filterStatus || ""}
              onChange={(e) => {
                setFilterStatus(e.target.value || null);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg text-sm"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Courses ({filteredCourses.length})
          </CardTitle>
          <CardDescription>Page {currentPage} of {totalPages}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-slate-700">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-slate-300">Course Title</TableHead>
                      <TableHead className="text-slate-300">Instructor</TableHead>
                      <TableHead className="text-slate-300">Category</TableHead>
                      <TableHead className="text-slate-300 text-right">Students</TableHead>
                      <TableHead className="text-slate-300 text-right">Rating</TableHead>
                      <TableHead className="text-slate-300 text-right">Price</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCourses.map((course) => (
                      <TableRow key={course.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium line-clamp-1">{course.title}</p>
                            <p className="text-xs text-slate-400">ID: {course.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{course.instructor}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-700 border-slate-600 text-slate-300">
                            {course.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-white font-medium">{course.students}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-white font-medium">{course.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-white font-medium">${course.price}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              course.status === "PUBLISHED"
                                ? "bg-green-500/20 text-green-400 border-green-600"
                                : course.status === "DRAFT"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-600"
                                  : "bg-slate-500/20 text-slate-400 border-slate-600"
                            }
                          >
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-slate-700">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem className="text-slate-300 cursor-pointer">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300 cursor-pointer">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-slate-300 cursor-pointer">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 cursor-pointer"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourses;
