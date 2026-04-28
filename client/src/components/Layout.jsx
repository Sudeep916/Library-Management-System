import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePathForRole } from "../utils/navigation";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navClassName = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;
  const homePath = getHomePathForRole(user.role);

  const handleLogout = () => {
    logout();
    navigate("/logout");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Library Management System</p>
          <h1>Library Management System</h1>
        </div>
        <div className="topbar-actions">
          <span className="role-chip">{user.role.toUpperCase()}</span>
          <button className="btn ghost" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="nav-strip">
        <NavLink to={homePath} className={navClassName}>
          Home
        </NavLink>
        {user.role === "admin" && (
          <NavLink to="/maintenance" className={navClassName}>
            Maintenance
          </NavLink>
        )}
        <NavLink to="/reports" className={navClassName}>
          Reports
        </NavLink>
        <NavLink to="/transactions" className={navClassName}>
          Transactions
        </NavLink>
      </nav>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
