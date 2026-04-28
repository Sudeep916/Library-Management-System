import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { formatCurrency, formatDate, toDateInput } from "../utils/date";

const FinePayPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state?.returnDraft;
  const [finePaid, setFinePaid] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!draft) {
    return (
      <section className="page-card">
        <h2>Fine Pay</h2>
        <p className="message error">Return details are missing. Start from the Return Book page.</p>
        <Link className="btn secondary inline-button" to="/transactions?tab=return">
          Back to Return Book
        </Link>
      </section>
    );
  }

  const handleConfirm = async () => {
    setMessage("");

    if (draft.fineAmount > 0 && !finePaid) {
      setMessage("Select Fine Paid before completing the return book transaction.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post("/transactions/complete-return", {
        borrowId: draft.borrowId,
        actualReturnDate: toDateInput(draft.actualReturnDate),
        finePaid,
        remarks
      });

      navigate("/transactions?tab=return", {
        replace: true,
        state: {
          message: data.message
        }
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to complete fine payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-card">
      <p className="eyebrow">Fine Pay</p>
      <h2>Complete return transaction</h2>

      <div className="summary-grid">
        <div className="info-panel">
          <p>
            <strong>Book:</strong> {draft.title}
          </p>
          <p>
            <strong>Author:</strong> {draft.author}
          </p>
          <p>
            <strong>Serial No:</strong> {draft.serialNumber}
          </p>
          <p>
            <strong>Membership:</strong> {draft.memberName} ({draft.membershipNumber})
          </p>
        </div>
        <div className="info-panel">
          <p>
            <strong>Issue Date:</strong> {formatDate(draft.issueDate)}
          </p>
          <p>
            <strong>Planned Return Date:</strong> {formatDate(draft.dueDate)}
          </p>
          <p>
            <strong>Selected Return Date:</strong> {formatDate(draft.actualReturnDate)}
          </p>
          <p>
            <strong>Calculated Fine:</strong> {formatCurrency(draft.fineAmount)}
          </p>
        </div>
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={finePaid} onChange={(event) => setFinePaid(event.target.checked)} />
        Fine Paid
      </label>

      <label className="field-group">
        <span>Remarks</span>
        <textarea rows="3" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
      </label>

      {message && <p className="message error">{message}</p>}

      <div className="action-row">
        <button className="btn primary" type="button" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Completing..." : "Confirm Return"}
        </button>
        <Link className="btn secondary" to="/transactions?tab=return">
          Back
        </Link>
      </div>
    </section>
  );
};

export default FinePayPage;

