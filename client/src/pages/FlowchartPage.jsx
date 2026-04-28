import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePathForRole } from "../utils/navigation";

const FlowchartPage = () => {
  const { user } = useAuth();

  return (
    <div className="public-shell">
      <section className="page-card wide-card">
        <p className="eyebrow">Application Flow</p>
        <h2>Library Management System chart</h2>
        <p className="muted-text">
          This chart follows the workbook structure: separate Admin and User logins, separate Admin
          and User home pages, and shared Reports and Transactions with Maintenance reserved for
          Admin only.
        </p>

        <div className="flow-grid">
          <div className="flow-node">
            <h3>Admin Login</h3>
            <p>Separate admin login page leading to Admin Home Page.</p>
          </div>
          <div className="flow-node">
            <h3>User Login</h3>
            <p>Separate user login page leading to User Home Page.</p>
          </div>
          <div className="flow-node">
            <h3>Admin Home</h3>
            <p>Maintenance, Reports, Transactions, and product details.</p>
          </div>
          <div className="flow-node">
            <h3>User Home</h3>
            <p>Reports, Transactions, and product details.</p>
          </div>
          <div className="flow-node">
            <h3>Modules</h3>
            <p>Maintenance feeds Reports and Transactions, and Pay Fine completes returns.</p>
          </div>
        </div>

        <ol className="flow-list">
          <li>Admin uses a separate Admin Login page and lands on Admin Home Page.</li>
          <li>User uses a separate User Login page and lands on User Home Page.</li>
          <li>Admin can access Maintenance, Reports, and Transactions.</li>
          <li>User can access Reports and Transactions only.</li>
          <li>Return Book always continues to Pay Fine before completion.</li>
        </ol>

        <div className="action-row">
          <Link className="btn secondary" to="/admin/login">
            Admin Login
          </Link>
          <Link className="btn secondary" to="/user/login">
            User Login
          </Link>
          {user && (
            <Link className="btn secondary" to={getHomePathForRole(user.role)}>
              Home
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default FlowchartPage;
