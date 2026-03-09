import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ManageScans from "./pages/admin/ManageScans";
import ScanVerification from "./pages/admin/ScanVerification";
import ProgressReports from "./pages/admin/ProgressReports";
import { ToastProvider } from "./context/ToastContext";

import LandingPage from "./pages/LandingPage";
import UserLogin from "./pages/user/UserLogin";
import UserRegister from "./pages/user/UserRegister";
import ForgotPassword from "./pages/user/ForgotPassword";
import UserLayout from "./components/UserLayout";
import UserDashboard from "./pages/user/UserDashboard";
import UserProfile from "./pages/user/UserProfile";
import SkinAnalysis from "./pages/user/SkinAnalysis";
import ScanDetails from "./pages/user/ScanDetails";
import ProgressReport from "./pages/user/ProgressReport";

import AdminLayout from "./components/AdminLayout";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminUserDetail from "./pages/admin/AdminUserDetail";

import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Landing Page at Root */}
          <Route path="/" element={<LandingPage />} />

          {/* User Auth Pages (Public) */}
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/user/forgot-password" element={<ForgotPassword />} />

          {/* User Dashboard Routes — Protected, require user session */}
          <Route element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/analysis" element={<SkinAnalysis />} />
            <Route path="/user/scan/:analysisId" element={<ScanDetails />} />
            <Route path="/user/progress-report" element={<ProgressReport />} />
          </Route>

          {/* Admin Auth Page (Public) */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin Dashboard Routes — Protected, require admin session */}
          <Route path="/dashboard" element={
            <AdminRoute>
              <AdminLayout><Dashboard /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/dashboard/users" element={
            <AdminRoute>
              <AdminLayout><ManageUsers /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/dashboard/user/:userId" element={
            <AdminRoute>
              <AdminLayout><AdminUserDetail /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/dashboard/scans" element={
            <AdminRoute>
              <AdminLayout><ManageScans /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/dashboard/verification/:analysisId" element={
            <AdminRoute>
              <AdminLayout><ScanVerification /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/dashboard/profile" element={
            <AdminRoute>
              <AdminLayout><AdminProfile /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/dashboard/progress-reports" element={
            <AdminRoute>
              <AdminLayout><ProgressReports /></AdminLayout>
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;


