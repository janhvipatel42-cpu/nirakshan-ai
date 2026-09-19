import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
