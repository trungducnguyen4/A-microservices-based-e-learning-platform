import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lock, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireAuth?: boolean;
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireAuth = true,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being initialized
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If no role is required, render children
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Check role requirements
  const hasRequiredRole = (() => {
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
  })();

  // If user doesn't have required role, show unauthorized page
  if (!hasRequiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-4 sm:pt-6 text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Access Denied</h2>
            
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              You don't have permission to access this page. This area is restricted to:
            </p>
            
            <div className="flex justify-center gap-2 mb-4 sm:mb-6 flex-wrap">
              {requiredRoles.map((role) => (
                <Badge key={role} variant="outline" className="capitalize text-xs sm:text-sm">
                  {role}
                </Badge>
              ))}
            </div>
            
            {user && (
              <div className="bg-muted p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Currently logged in as:
                </p>
                <p className="font-medium text-sm sm:text-base">{user.name}</p>
                <Badge variant="secondary" className="capitalize mt-1 text-xs sm:text-sm">
                  {user.role}
                </Badge>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                variant="outline" 
                className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              
              <Button 
                variant="outline" 
                className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                onClick={logout}
              >
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Switch Account
              </Button>
              
              <Button className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto" onClick={() => {
                // Navigate to appropriate dashboard based on current role
                const path = user?.role ? `/${user.role}` : '/';
                window.location.href = path;
              }}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required role, render children
  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

export function TeacherRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="teacher">
      {children}
    </ProtectedRoute>
  );
}

export function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="student">
      {children}
    </ProtectedRoute>
  );
}

export function TeacherOrAdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole={['teacher', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true}>
      {children}
    </ProtectedRoute>
  );
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}