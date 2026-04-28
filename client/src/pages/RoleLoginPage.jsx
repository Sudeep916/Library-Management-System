import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePathForRole, getRoleLabel } from "../utils/navigation";

const credentialCopy = {
  admin: {
    username: "adm",
    password: "adm"
  },
  user: {
    username: "user",
    password: "user"
  }
};

const RoleLoginPage = ({ role }) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const roleLabel = getRoleLabel(role);
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.username.trim() || !form.password) {
      setMessage("Enter both User ID and Password.");
      return;
    }

    try {
      setSubmitting(true);
      const loggedInUser = await login({
        ...form,
        expectedRole: role
      });
      navigate(getHomePathForRole(loggedInUser.role), { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || `Unable to login to the ${roleLabel} page.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-shell">
      <section className="page-card login-card">
        <p className="eyebrow">{roleLabel} Login</p>
        <h2>Library Management System</h2>

        <form className="stack-form" onSubmit={handleSubmit} noValidate>
          <label className="field-group">
            <span>User ID</span>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder={`Enter ${roleLabel.toLowerCase()} user id`}
            />
          </label>

          <label className="field-group">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </label>

          {message && <p className="message error">{message}</p>}

          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="credential-box">
          <p>
            <strong>User ID:</strong> {credentialCopy[role].username}
          </p>
          <p>
            <strong>Password:</strong> {credentialCopy[role].password}
          </p>
        </div>

        <Link className="text-link" to="/">
          Back to Home
        </Link>
      </section>
    </div>
  );
};

export default RoleLoginPage;
