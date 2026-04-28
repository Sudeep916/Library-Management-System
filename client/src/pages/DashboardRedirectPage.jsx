import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePathForRole } from "../utils/navigation";

const DashboardRedirectPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const targetPath = getHomePathForRole(user.role);

  if (location.pathname === targetPath) {
    return null;
  }

  return <Navigate to={targetPath} replace />;
};

export default DashboardRedirectPage;