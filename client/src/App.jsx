import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminHomePage from "./pages/AdminHomePage";
import DashboardRedirectPage from "./pages/DashboardRedirectPage";
import FinePayPage from "./pages/FinePayPage";
import LandingPage from "./pages/LandingPage";
import LogoutPage from "./pages/LogoutPage";
import MaintenancePage from "./pages/MaintenancePage";
import ReportsPage from "./pages/ReportsPage";
import RoleLoginPage from "./pages/RoleLoginPage";
import TransactionsPage from "./pages/TransactionsPage";
import UserHomePage from "./pages/UserHomePage";

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Navigate to="/" replace />} />
    <Route path="/admin/login" element={<RoleLoginPage role="admin" />} />
    <Route path="/user/login" element={<RoleLoginPage role="user" />} />
    <Route path="/logout" element={<LogoutPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route index element={<DashboardRedirectPage />} />
        <Route path="/dashboard" element={<DashboardRedirectPage />} />
        <Route path="/admin/home" element={<ProtectedRoute roles={["admin"]} />}>
          <Route index element={<AdminHomePage />} />
        </Route>
        <Route path="/user/home" element={<ProtectedRoute roles={["user"]} />}>
          <Route index element={<UserHomePage />} />
        </Route>
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/fine-pay" element={<FinePayPage />} />

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/maintenance" element={<MaintenancePage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
