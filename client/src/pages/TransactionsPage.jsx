import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  addDaysToInput,
  formatCurrency,
  formatDate,
  todayInputValue,
  toDateInput
} from "../utils/date";

const createIssueForm = (membershipNumber = "") => ({
  bookId: "",
  bookName: "",
  author: "",
  serialNumber: "",
  membershipNumber,
  issueDate: todayInputValue(),
  returnDate: addDaysToInput(todayInputValue(), 15),
  remarks: ""
});

const emptyReturnForm = {
  title: "",
  serialNumber: "",
  author: "",
  issueDate: "",
  dueDate: "",
  returnDate: "",
  borrowId: ""
};

const transactionTabs = [
  { key: "availability", label: "Is Book Available?" },
  { key: "issue", label: "Issue Book" },
  { key: "return", label: "Return Book" }
];

const TransactionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = transactionTabs.some((item) => item.key === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "availability";

  const [availableBooks, setAvailableBooks] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [borrowHistory, setBorrowHistory] = useState([]);

  const [availabilityFilters, setAvailabilityFilters] = useState({
    title: "",
    type: ""
  });
  const [availabilityResults, setAvailabilityResults] = useState([]);
  const [selectedAvailableBookId, setSelectedAvailableBookId] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState({
    text: "",
    type: "success"
  });

  const [issueForm, setIssueForm] = useState(() =>
    createIssueForm(user.role === "user" ? user.membershipNumber || "" : "")
  );
  const [issueMessage, setIssueMessage] = useState({ text: "", type: "success" });

  const [returnForm, setReturnForm] = useState(emptyReturnForm);
  const [returnMessage, setReturnMessage] = useState({ text: "", type: "success" });
  const [selectedBorrowId, setSelectedBorrowId] = useState("");

  const loadTransactionData = async () => {
    const membershipRequest =
      user.role === "admin"
        ? api.get("/memberships/active")
        : Promise.resolve({ data: { memberships: [] } });

    const [booksResponse, membershipsResponse, activeBorrowsResponse, historyResponse] =
      await Promise.all([
        api.get("/books/available"),
        membershipRequest,
        api.get("/transactions/active"),
        api.get("/transactions/history")
      ]);

    setAvailableBooks(booksResponse.data.books);
    setMemberships(membershipsResponse.data.memberships);
    setActiveBorrows(activeBorrowsResponse.data.borrows);
    setBorrowHistory(historyResponse.data.borrows);
  };

  const applyBookToIssueForm = (book) => {
    setIssueForm((current) => ({
      ...current,
      bookId: book.id || book._id,
      bookName: book.title,
      author: book.author,
      serialNumber: book.serialNumber
    }));
    setIssueMessage({ text: "", type: "success" });
  };

  const applyBorrowToReturnForm = (borrow) => {
    setSelectedBorrowId(borrow.id);
    setReturnForm({
      title: borrow.title,
      serialNumber: borrow.serialNumber,
      author: borrow.author,
      issueDate: toDateInput(borrow.issueDate),
      dueDate: toDateInput(borrow.dueDate),
      returnDate: toDateInput(borrow.dueDate),
      borrowId: borrow.id
    });
    setReturnMessage({ text: "Selected transaction loaded.", type: "success" });
  };

  useEffect(() => {
    loadTransactionData().catch(() => {
      setAvailabilityMessage({
        text: "Unable to load transaction data.",
        type: "error"
      });
    });
  }, []);

  useEffect(() => {
    if (user.role === "user") {
      setIssueForm((current) => ({
        ...current,
        membershipNumber: user.membershipNumber || ""
      }));
    }
  }, [user.membershipNumber, user.role]);

  useEffect(() => {
    if (location.state?.message) {
      setReturnMessage({ text: location.state.message, type: "success" });
    }
  }, [location.state]);

  useEffect(() => {
    const preselectedBook = location.state?.preselectedBook;

    if (preselectedBook) {
      applyBookToIssueForm(preselectedBook);
      setSearchParams({ tab: "issue" });
    }
  }, [location.state?.preselectedBook]);

  const selectedAvailableBook = availabilityResults.find(
    (book) => (book.id || book._id) === selectedAvailableBookId
  );
  const selectedBorrow = activeBorrows.find((borrow) => borrow.id === selectedBorrowId);

  const userTransactionLabel = useMemo(
    () => (user.role === "admin" ? "Current Active Transactions" : "Your Transactions"),
    [user.role]
  );

  const handleAvailabilitySearch = async (event) => {
    event.preventDefault();
    setAvailabilityMessage({ text: "", type: "success" });
    setSelectedAvailableBookId("");

    if (!availabilityFilters.title.trim() && !availabilityFilters.type) {
      setAvailabilityMessage({
        text: "Enter a book name or choose a type to make a valid selection.",
        type: "error"
      });
      setAvailabilityResults([]);
      return;
    }

    try {
      const { data } = await api.get("/reports/available-books", {
        params: {
          title: availabilityFilters.title,
          type: availabilityFilters.type
        }
      });

      setAvailabilityResults(data.books);
      if (data.books.length === 0) {
        setAvailabilityMessage({
          text: "No available books matched the selected filters.",
          type: "error"
        });
      }
    } catch (error) {
      setAvailabilityResults([]);
      setAvailabilityMessage({
        text: error.response?.data?.message || "Unable to load available books.",
        type: "error"
      });
    }
  };

  const handleIssueSelectionFromResults = () => {
    if (!selectedAvailableBook) {
      setAvailabilityMessage({
        text: "Choose a radio button from the search results before continuing.",
        type: "error"
      });
      return;
    }

    applyBookToIssueForm(selectedAvailableBook);
    setSearchParams({ tab: "issue" });
  };

  const chooseIssueBook = (bookId) => {
    const selectedBook = availableBooks.find((book) => book._id === bookId);

    if (!selectedBook) {
      setIssueForm((current) => ({
        ...current,
        bookId: "",
        bookName: "",
        author: "",
        serialNumber: ""
      }));
      return;
    }

    applyBookToIssueForm(selectedBook);
  };

  const handleIssueDateChange = (value) => {
    const maxReturnDate = addDaysToInput(value, 15);
    let nextReturnDate = issueForm.returnDate;

    if (!nextReturnDate || nextReturnDate < value || nextReturnDate > maxReturnDate) {
      nextReturnDate = maxReturnDate;
    }

    setIssueForm((current) => ({
      ...current,
      issueDate: value,
      returnDate: nextReturnDate
    }));
  };

  const resetIssueForm = () => {
    setIssueForm(createIssueForm(user.role === "user" ? user.membershipNumber || "" : ""));
  };

  const handleIssueSubmit = async (event) => {
    event.preventDefault();
    setIssueMessage({ text: "", type: "success" });

    if (
      !issueForm.bookId ||
      !issueForm.bookName ||
      !issueForm.author ||
      !issueForm.issueDate ||
      !issueForm.returnDate ||
      !issueForm.membershipNumber
    ) {
      setIssueMessage({
        text: "Make a valid selection of the feature before submitting the issue form.",
        type: "error"
      });
      return;
    }

    try {
      const { data } = await api.post("/transactions/issue", issueForm);
      setIssueMessage({ text: data.message, type: "success" });
      resetIssueForm();
      setAvailabilityResults([]);
      setSelectedAvailableBookId("");
      await loadTransactionData();
    } catch (error) {
      setIssueMessage({
        text: error.response?.data?.message || "Unable to issue book.",
        type: "error"
      });
    }
  };

  const resetReturnDetails = (field, value) => {
    setSelectedBorrowId("");
    setReturnForm((current) => ({
      ...current,
      [field]: value,
      author: "",
      issueDate: "",
      dueDate: "",
      returnDate: "",
      borrowId: ""
    }));
  };

  const handleLoadIssue = async () => {
    if (selectedBorrow) {
      applyBorrowToReturnForm(selectedBorrow);
      return;
    }

    if (!returnForm.title.trim() || !returnForm.serialNumber.trim()) {
      setReturnMessage({
        text: "Name of Book and Serial No are mandatory before loading issue details.",
        type: "error"
      });
      return;
    }

    try {
      const { data } = await api.get("/transactions/lookup-issue", {
        params: {
          title: returnForm.title,
          serialNumber: returnForm.serialNumber
        }
      });

      applyBorrowToReturnForm(data.borrow);
    } catch (error) {
      setReturnMessage({
        text: error.response?.data?.message || "Unable to load issue details.",
        type: "error"
      });
    }
  };

  const handlePrepareReturn = async (event) => {
    event.preventDefault();
    setReturnMessage({ text: "", type: "success" });

    if (
      !returnForm.title.trim() ||
      !returnForm.author ||
      !returnForm.serialNumber.trim() ||
      !returnForm.issueDate ||
      !returnForm.returnDate ||
      !returnForm.borrowId
    ) {
      setReturnMessage({
        text: "Make a valid selection of the feature before confirming return book.",
        type: "error"
      });
      return;
    }

    try {
      const { data } = await api.post("/transactions/prepare-return", {
        title: returnForm.title,
        serialNumber: returnForm.serialNumber,
        returnDate: returnForm.returnDate
      });

      navigate("/transactions/fine-pay", {
        state: {
          returnDraft: data.returnDraft
        }
      });
    } catch (error) {
      setReturnMessage({
        text: error.response?.data?.message || "Unable to continue to pay fine.",
        type: "error"
      });
    }
  };

  return (
    <section className="page-card">
      <p className="eyebrow">Transactions</p>
      <h2>Transactions</h2>
      <p className="muted-text">
        {user.role === "admin"
          ? "Search availability, issue books, and process returns for the whole library."
          : "Only your linked membership transactions are shown here, and fine payment is limited to your selected books."}
      </p>

      <div className="section-tabs">
        {transactionTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`tab-button ${tab === item.key ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: item.key })}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "availability" && (
        <>
          <form className="stack-form" onSubmit={handleAvailabilitySearch} noValidate>
            <div className="form-grid">
              <label className="field-group">
                <span>Enter Book Name</span>
                <input
                  type="text"
                  value={availabilityFilters.title}
                  onChange={(event) =>
                    setAvailabilityFilters((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field-group">
                <span>Type</span>
                <select
                  value={availabilityFilters.type}
                  onChange={(event) =>
                    setAvailabilityFilters((current) => ({
                      ...current,
                      type: event.target.value
                    }))
                  }
                >
                  <option value="">Choose type</option>
                  <option value="book">Book</option>
                  <option value="movie">Movie</option>
                </select>
              </label>
            </div>

            {availabilityMessage.text && (
              <p className={`message ${availabilityMessage.type}`}>{availabilityMessage.text}</p>
            )}

            <div className="action-row">
              <button className="btn primary" type="submit">
                Search Availability
              </button>
              <button className="btn secondary" type="button" onClick={handleIssueSelectionFromResults}>
                Continue to Issue Book
              </button>
            </div>
          </form>

          <div className="table-wrap spaced-top">
            <table>
              <thead>
                <tr>
                  <th>Book Name</th>
                  <th>Author Name</th>
                  <th>Serial Number</th>
                  <th>Available</th>
                  <th>Select</th>
                </tr>
              </thead>
              <tbody>
                {availabilityResults.length === 0 ? (
                  <tr>
                    <td colSpan="5">Search results will appear here.</td>
                  </tr>
                ) : (
                  availabilityResults.map((book) => (
                    <tr key={book._id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.serialNumber}</td>
                      <td>{book.isIssued ? "N" : "Y"}</td>
                      <td>
                        <input
                          type="radio"
                          name="selectedAvailableBook"
                          checked={selectedAvailableBookId === book._id}
                          onChange={() => setSelectedAvailableBookId(book._id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "issue" && (
        <form className="stack-form" onSubmit={handleIssueSubmit} noValidate>
          <div className="form-grid">
            <label className="field-group full-span">
              <span>Enter Book Name</span>
              <select value={issueForm.bookId} onChange={(event) => chooseIssueBook(event.target.value)}>
                <option value="">Choose an available book</option>
                {availableBooks.map((book) => (
                  <option key={book._id} value={book._id}>
                    {book.title} ({book.serialNumber})
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Name of Book</span>
              <input type="text" value={issueForm.bookName} readOnly />
            </label>
            <label className="field-group">
              <span>Name of Author</span>
              <input type="text" value={issueForm.author} readOnly />
            </label>
            <label className="field-group">
              <span>Serial Number</span>
              <input type="text" value={issueForm.serialNumber} readOnly />
            </label>
            {user.role === "admin" ? (
              <label className="field-group">
                <span>Membership Number</span>
                <select
                  value={issueForm.membershipNumber}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      membershipNumber: event.target.value
                    }))
                  }
                >
                  <option value="">Choose membership</option>
                  {memberships.map((membership) => (
                    <option key={membership._id} value={membership.membershipNumber}>
                      {membership.membershipNumber} - {membership.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="field-group">
                <span>Membership Number</span>
                <input type="text" value={issueForm.membershipNumber || "Not linked"} readOnly />
              </label>
            )}
            <label className="field-group">
              <span>Issue Date</span>
              <input
                type="date"
                min={todayInputValue()}
                value={issueForm.issueDate}
                onChange={(event) => handleIssueDateChange(event.target.value)}
              />
            </label>
            <label className="field-group">
              <span>Return Date</span>
              <input
                type="date"
                min={issueForm.issueDate}
                max={addDaysToInput(issueForm.issueDate, 15)}
                value={issueForm.returnDate}
                onChange={(event) =>
                  setIssueForm((current) => ({ ...current, returnDate: event.target.value }))
                }
              />
            </label>
            <label className="field-group full-span">
              <span>Remarks</span>
              <textarea
                rows="3"
                value={issueForm.remarks}
                onChange={(event) =>
                  setIssueForm((current) => ({ ...current, remarks: event.target.value }))
                }
              />
            </label>
          </div>

          {issueMessage.text && <p className={`message ${issueMessage.type}`}>{issueMessage.text}</p>}

          <div className="action-row">
            <button className="btn primary" type="submit">
              Confirm Issue
            </button>
            <button className="btn secondary" type="button" onClick={resetIssueForm}>
              Clear
            </button>
          </div>
        </form>
      )}

      {tab === "return" && (
        <>
          <div className="info-panel">
            <p>
              <strong>{userTransactionLabel}:</strong> select a row below or load one manually.
            </p>
          </div>

          <div className="table-wrap spaced-top">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Book</th>
                  <th>Serial</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>Fine Due</th>
                </tr>
              </thead>
              <tbody>
                {activeBorrows.length === 0 ? (
                  <tr>
                    <td colSpan="6">No active transactions are available.</td>
                  </tr>
                ) : (
                  activeBorrows.map((borrow) => (
                    <tr key={borrow.id}>
                      <td>
                        <input
                          type="radio"
                          name="selectedBorrow"
                          checked={selectedBorrowId === borrow.id}
                          onChange={() => setSelectedBorrowId(borrow.id)}
                        />
                      </td>
                      <td>{borrow.title}</td>
                      <td>{borrow.serialNumber}</td>
                      <td>{formatDate(borrow.issueDate)}</td>
                      <td>{formatDate(borrow.dueDate)}</td>
                      <td>{formatCurrency(borrow.currentFineAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="action-row spaced-top">
            <button className="btn secondary" type="button" onClick={handleLoadIssue}>
              Use Selected Transaction
            </button>
          </div>

          <form className="stack-form spaced-top" onSubmit={handlePrepareReturn} noValidate>
            <div className="lookup-row">
              <label className="field-group grow">
                <span>Name of Book</span>
                <input
                  type="text"
                  value={returnForm.title}
                  onChange={(event) => resetReturnDetails("title", event.target.value)}
                />
              </label>
              <label className="field-group grow">
                <span>Serial No</span>
                <input
                  type="text"
                  value={returnForm.serialNumber}
                  onChange={(event) => resetReturnDetails("serialNumber", event.target.value)}
                />
              </label>
              <button className="btn secondary" type="button" onClick={handleLoadIssue}>
                Load Issue
              </button>
            </div>

            <div className="form-grid">
              <label className="field-group">
                <span>Author Name</span>
                <input type="text" value={returnForm.author} readOnly />
              </label>
              <label className="field-group">
                <span>Issue Date</span>
                <input type="date" value={returnForm.issueDate} readOnly />
              </label>
              <label className="field-group">
                <span>Return Date</span>
                <input
                  type="date"
                  value={returnForm.returnDate}
                  onChange={(event) =>
                    setReturnForm((current) => ({ ...current, returnDate: event.target.value }))
                  }
                />
              </label>
            </div>

            {returnMessage.text && <p className={`message ${returnMessage.type}`}>{returnMessage.text}</p>}

            <button className="btn primary" type="submit">
              Confirm and Continue to Pay Fine
            </button>
          </form>
        </>
      )}

      <div className="table-wrap spaced-top">
        <h3>{user.role === "admin" ? "All Transaction History" : "Your Transaction History"}</h3>
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Serial</th>
              <th>Status</th>
              <th>Issue Date</th>
              <th>Return Date</th>
              <th>Actual Return</th>
              <th>Fine</th>
            </tr>
          </thead>
          <tbody>
            {borrowHistory.length === 0 ? (
              <tr>
                <td colSpan="7">No transaction history is available.</td>
              </tr>
            ) : (
              borrowHistory.map((borrow) => (
                <tr key={borrow.id}>
                  <td>{borrow.title}</td>
                  <td>{borrow.serialNumber}</td>
                  <td>{borrow.status}</td>
                  <td>{formatDate(borrow.issueDate)}</td>
                  <td>{formatDate(borrow.dueDate)}</td>
                  <td>{borrow.actualReturnDate ? formatDate(borrow.actualReturnDate) : "-"}</td>
                  <td>{formatCurrency(borrow.currentFineAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TransactionsPage;
