import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminHomePage from "./pages/AdminHomePage";
import UserHomePage from "./pages/UserHomePage";
import DashboardRedirectPage from "./pages/DashboardRedirectPage";

import FinePayPage from "./pages/FinePayPage";
import LandingPage from "./pages/LandingPage";
import LogoutPage from "./pages/LogoutPage";
import MaintenancePage from "./pages/MaintenancePage";
import ReportsPage from "./pages/ReportsPage";
import RoleLoginPage from "./pages/RoleLoginPage";
import TransactionsPage from "./pages/TransactionsPage";

const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<LandingPage />} />
    <Route path="/admin/login" element={<RoleLoginPage role="admin" />} />
    <Route path="/user/login" element={<RoleLoginPage role="user" />} />
    <Route path="/logout" element={<LogoutPage />} />

    {/* Protected */}
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route index element={<DashboardRedirectPage />} />
        <Route path="/dashboard" element={<DashboardRedirectPage />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin/home" element={<AdminHomePage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
        </Route>

        {/* User routes */}
        <Route element={<ProtectedRoute roles={["user"]} />}>
          <Route path="/user/home" element={<UserHomePage />} />
        </Route>

        {/* Shared */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/fine-pay" element={<FinePayPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;