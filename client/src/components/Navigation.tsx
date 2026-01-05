import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  Users, 
  Video, 
  BarChart3, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  X,
  FileText,
  GraduationCap,
  PlusCircle,
  User,
  Shield
} from "lucide-react";
import { useAuth, getRoleDisplayName, getRoleColor } from "@/contexts/AuthContext";
import { APP_LOGO_URL, APP_NAME } from "@/lib/brand";

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  
  // Define navigation items based on roles
  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { path: "/", label: "Home", icon: BookOpen },
      ];
    }

    // When authenticated we don't show the generic Dashboard link in the navbar
    const baseItems = [];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { path: "/admin", label: "Admin Panel", icon: Shield },
          { path: "/meet", label: "Meet", icon: Video },
        ];
      case 'teacher':
        return [
          ...baseItems,
          { path: "/teacher", label: "Teacher Dashboard", icon: Users },
          { path: "/meet", label: "Meet", icon: Video },
        ];
      case 'student':
        return [
          ...baseItems,
          { path: "/student", label: "Student Portal", icon: BookOpen },
          { path: "/meet", label: "Meet", icon: Video },
        ];
      default:
        return baseItems;
    }
  };

  const getQuickActions = () => {
    if (!isAuthenticated) return [];

    switch (user?.role) {
      case 'teacher':
        return [
          { path: "/teacher/create-assignment", label: "Create Assignment", icon: PlusCircle },
          { path: "/teacher/grading", label: "Grade Assignments", icon: GraduationCap },
        ];
      case 'student':
        return [
          { path: "/student/assignments", label: "My Assignments", icon: FileText },
          { path: "/student/submissions", label: "My Submissions", icon: BookOpen },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const quickActions = getQuickActions();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2">
              <img
                src={APP_LOGO_URL}
                alt={APP_NAME}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  // Fallback to icon if image missing
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Quick access items - only show for authenticated users */}
            {quickActions.length > 0 && (
              <>
                <div className="h-6 border-l border-border mx-2"></div>
                {quickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-1.5 sm:space-x-4 flex-shrink-0">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                      <AvatarFallback>
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover" align="end">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {user?.role && (
                      <Badge 
                        variant="secondary" 
                        className={`mt-1 capitalize text-xs ${getRoleColor(user.role)}`}
                      >
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Schedule</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Login/SignUp for non-authenticated users on mobile */}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Sign Up</span>
                  </Link>
                  <div className="border-t border-border my-2"></div>
                </>
              )}
              
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Quick actions for mobile */}
              {quickActions.length > 0 && (
                <>
                  <div className="border-t border-border my-2"></div>
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;