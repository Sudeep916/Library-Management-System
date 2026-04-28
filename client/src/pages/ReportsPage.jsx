import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate } from "../utils/date";

const reportTabs = [
  { key: "books", label: "Master List of Books" },
  { key: "movies", label: "Master List of Movies" },
  { key: "memberships", label: "Master List of Memberships" },
  { key: "activeIssues", label: "Active Issues" },
  { key: "overdueReturns", label: "Overdue Returns" },
  { key: "issueRequests", label: "Pending Issue Requests" }
];

const reportDefaults = {
  books: [],
  movies: [],
  memberships: [],
  activeIssues: [],
  overdueReturns: [],
  issueRequests: []
};

const reportColumnMap = {
  books: [
    { key: "serialNumber", label: "Serial No" },
    { key: "title", label: "Name of Book" },
    { key: "author", label: "Author Name" },
    { key: "category", label: "Category" },
    { key: "status", label: "Status" },
    { key: "shelfLocation", label: "Shelf" }
  ],
  movies: [
    { key: "serialNumber", label: "Serial No" },
    { key: "title", label: "Name of Movie" },
    { key: "author", label: "Author Name" },
    { key: "category", label: "Category" },
    { key: "status", label: "Status" },
    { key: "shelfLocation", label: "Shelf" }
  ],
  memberships: [
    { key: "membershipNumber", label: "Membership Id" },
    { key: "name", label: "Name of Member" },
    { key: "phone", label: "Contact Number" },
    { key: "address", label: "Contact Address" },
    { key: "startDate", label: "Start Date", format: "date" },
    { key: "endDate", label: "End Date", format: "date" },
    { key: "status", label: "Status" },
    { key: "pendingFine", label: "Amount Pending", format: "currency" }
  ],
  activeIssues: [
    { key: "serialNumber", label: "Serial No Book/Movie" },
    { key: "title", label: "Name of Book/Movie" },
    { key: "membershipNumber", label: "Membership Id" },
    { key: "issueDate", label: "Date of Issue", format: "date" },
    { key: "dueDate", label: "Date of Return", format: "date" }
  ],
  overdueReturns: [
    { key: "serialNumber", label: "Serial No Book" },
    { key: "title", label: "Name of Book" },
    { key: "membershipNumber", label: "Membership Id" },
    { key: "issueDate", label: "Date of Issue", format: "date" },
    { key: "dueDate", label: "Date of Return", format: "date" },
    { key: "fineAmount", label: "Fine Calculations", format: "currency" }
  ],
  issueRequests: [
    { key: "membershipNumber", label: "Membership Id" },
    { key: "title", label: "Name of Book/Movie" },
    { key: "requestedDate", label: "Requested Date", format: "date" },
    { key: "requestFulfilledDate", label: "Request Fulfilled Date", format: "date" },
    { key: "status", label: "Status" }
  ]
};

const renderCellValue = (row, column) => {
  const value = row[column.key];

  if (column.format === "date") {
    return value ? formatDate(value) : "-";
  }

  if (column.format === "currency") {
    return formatCurrency(value);
  }

  return value || "-";
};

const ReportsPage = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState("books");
  const [reports, setReports] = useState(reportDefaults);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const { data } = await api.get("/reports/collection");
        setReports(data.reports);
      } catch (error) {
        setMessage(error.response?.data?.message || "Unable to load reports right now.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const rows = useMemo(() => reports[activeReport] || [], [activeReport, reports]);
  const columns = reportColumnMap[activeReport];
  const activeLabel = reportTabs.find((tab) => tab.key === activeReport)?.label || "Report";

  return (
    <section className="page-card">
      <p className="eyebrow">Reports</p>
      <h2>Available Reports</h2>
      <p className="muted-text">
        {user.role === "admin"
          ? "Select a report generated from the maintenance and transaction data."
          : "Select a report from the workbook list. Membership and transaction rows are filtered to your linked account where applicable."}
      </p>

      <div className="report-shell">
        <div className="report-menu">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button report-tab ${activeReport === tab.key ? "active" : ""}`}
              onClick={() => setActiveReport(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="report-content">
          <div className="info-panel">
            <p>
              <strong>Current Report:</strong> {activeLabel}
            </p>
            <p>
              <strong>Rows:</strong> {rows.length}
            </p>
          </div>

          {message && <p className="message error">{message}</p>}
          {loading && <p className="message success">Loading reports...</p>}

          {!loading && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length}>No records are available for this report.</td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id}>
                        {columns.map((column) => (
                          <td key={column.key}>{renderCellValue(row, column)}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportsPage;
