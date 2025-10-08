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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page. This area is restricted to:
            </p>
            
            <div className="flex justify-center gap-2 mb-6">
              {requiredRoles.map((role) => (
                <Badge key={role} variant="outline" className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
            
            {user && (
              <div className="bg-muted p-3 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  Currently logged in as:
                </p>
                <p className="font-medium">{user.name}</p>
                <Badge variant="secondary" className="capitalize mt-1">
                  {user.role}
                </Badge>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              
              <Button 
                variant="outline" 
                onClick={logout}
              >
                <Lock className="h-4 w-4 mr-2" />
                Switch Account
              </Button>
              
              <Button onClick={() => {
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