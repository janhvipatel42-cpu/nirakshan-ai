import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { InspectionProvider } from "./context/InspectionContext.jsx";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NewInspectionPage from "./pages/NewInspectionPage.jsx";
import ProcessingPage from "./pages/ProcessingPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminRulesPage from "./pages/AdminRulesPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <InspectionProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/inspections/new" element={<ProtectedRoute><NewInspectionPage /></ProtectedRoute>} />
          <Route path="/inspections/:id/processing" element={<ProtectedRoute><ProcessingPage /></ProtectedRoute>} />
          <Route path="/inspections/:id/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/inspections/:id/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/rules" element={<AdminRoute><AdminRulesPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InspectionProvider>
    </AuthProvider>
  );
}
