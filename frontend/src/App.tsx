import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import UserLayout from "./layouts/UserLayout.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";
import UserHome from "./pages/user/UserHome.tsx";
import Classify from "./pages/user/Classify.tsx";
import Result from "./pages/user/Result.tsx";
import Details from "./pages/user/Details.tsx";
import History from "./pages/user/History.tsx";
import Profile from "./pages/user/Profile.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import UserManagement from "./pages/admin/UserManagement.tsx";
import Classifications from "./pages/admin/Classifications.tsx";
import ActivityLogs from "./pages/admin/ActivityLogs.tsx";
import ModelManagement from "./pages/admin/ModelManagement.tsx";
import AdminProfile from "./pages/admin/AdminProfile.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/user" element={
              <ProtectedRoute allowedRoles={[2]}>
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route index element={<UserHome />} />
              <Route path="classify" element={<Classify />} />
              <Route path="result" element={<Result />} />
              <Route path="details" element={<Details />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={[1]}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="classifications" element={<Classifications />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="models" element={<ModelManagement />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
