import { Link } from "react-router-dom";

const LandingPage = () => (
  <div className="public-shell">
    <section className="page-card narrow-card center-stack">
      <h1>Library Management System</h1>
      <div className="stack-actions">
        <Link className="btn primary full-button" to="/admin/login">
          Admin Login
        </Link>
        <Link className="btn secondary full-button" to="/user/login">
          User Login
        </Link>
      </div>
    </section>
  </div>
);

export default LandingPage;

