import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePathForRole } from "../utils/navigation";

const DashboardRedirectPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getHomePathForRole(user.role)} replace />;
};

export default DashboardRedirectPage;
