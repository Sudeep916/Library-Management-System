import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LogoutPage = () => {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="public-shell">
      <section className="page-card narrow-card">
        <p className="eyebrow">Log Out</p>
        <h2>You have successfully logged out.</h2>

        <div className="action-row">
          <Link className="btn secondary" to="/admin/login">
            Admin Login
          </Link>
          <Link className="btn secondary" to="/user/login">
            User Login
          </Link>
        </div>

        <Link className="text-link" to="/">
          Back to Home
        </Link>
      </section>
    </div>
  );
};

export default LogoutPage;
