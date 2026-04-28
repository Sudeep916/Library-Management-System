import { useEffect, useState } from "react";
import api from "../api/client";
import { formatDate } from "../utils/date";

const membershipDefaults = {
  name: "",
  email: "",
  phone: "",
  address: "",
  planMonths: "6"
};

const bookDefaults = {
  type: "book",
  title: "",
  author: "",
  category: "",
  serialNumber: "",
  shelfLocation: ""
};

const userDefaults = {
  name: "",
  username: "",
  password: "",
  role: "user",
  membershipNumber: "",
  active: true
};

const tabs = [
  { key: "addMembership", label: "Add Membership" },
  { key: "updateMembership", label: "Update Membership" },
  { key: "addBook", label: "Add Book" },
  { key: "updateBook", label: "Update Book" },
  { key: "userManagement", label: "User Management" }
];

const MaintenancePage = () => {
  const [activeTab, setActiveTab] = useState("addMembership");
  const [books, setBooks] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [users, setUsers] = useState([]);

  const [addMembershipForm, setAddMembershipForm] = useState(membershipDefaults);
  const [addMembershipMessage, setAddMembershipMessage] = useState({ text: "", type: "success" });

  const [membershipLookup, setMembershipLookup] = useState("");
  const [loadedMembership, setLoadedMembership] = useState(null);
  const [updateMembershipForm, setUpdateMembershipForm] = useState({
    action: "extend",
    extensionMonths: "6"
  });
  const [updateMembershipMessage, setUpdateMembershipMessage] = useState({
    text: "",
    type: "success"
  });

  const [addBookForm, setAddBookForm] = useState(bookDefaults);
  const [addBookMessage, setAddBookMessage] = useState({ text: "", type: "success" });

  const [selectedBookId, setSelectedBookId] = useState("");
  const [updateBookForm, setUpdateBookForm] = useState(bookDefaults);
  const [updateBookMessage, setUpdateBookMessage] = useState({ text: "", type: "success" });

  const [userMode, setUserMode] = useState("new");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userForm, setUserForm] = useState(userDefaults);
  const [userMessage, setUserMessage] = useState({ text: "", type: "success" });

  const loadAdminData = async () => {
    const [booksResponse, membershipsResponse, usersResponse] = await Promise.all([
      api.get("/books"),
      api.get("/memberships/active"),
      api.get("/users")
    ]);
    setBooks(booksResponse.data.books);
    setMemberships(membershipsResponse.data.memberships);
    setUsers(usersResponse.data.users);
  };

  useEffect(() => {
    loadAdminData().catch(() => {
      setAddBookMessage({
        text: "Unable to load maintenance data right now.",
        type: "error"
      });
    });
  }, []);

  const showResultMessage = (setter, value, isError = false) => {
    setter({ text: value, type: isError ? "error" : "success" });
  };

  const renderMessage = (message) =>
    message?.text ? <p className={`message ${message.type}`}>{message.text}</p> : null;

  const handleAddMembership = async (event) => {
    event.preventDefault();

    if (
      !addMembershipForm.name.trim() ||
      !addMembershipForm.email.trim() ||
      !addMembershipForm.phone.trim() ||
      !addMembershipForm.address.trim()
    ) {
      showResultMessage(setAddMembershipMessage, "All membership fields are mandatory.", true);
      return;
    }

    try {
      const { data } = await api.post("/memberships", addMembershipForm);
      setAddMembershipForm(membershipDefaults);
      showResultMessage(
        setAddMembershipMessage,
        `Membership created successfully. Number: ${data.membership.membershipNumber}`
      );
    } catch (error) {
      showResultMessage(
        setAddMembershipMessage,
        error.response?.data?.message || "Unable to create membership.",
        true
      );
    }
  };

  const handleMembershipLookup = async () => {
    if (!membershipLookup.trim()) {
      showResultMessage(setUpdateMembershipMessage, "Membership Number is mandatory.", true);
      return;
    }

    try {
      const { data } = await api.get(`/memberships/${membershipLookup.trim().toUpperCase()}`);
      setLoadedMembership(data.membership);
      showResultMessage(setUpdateMembershipMessage, "Membership details loaded.");
    } catch (error) {
      setLoadedMembership(null);
      showResultMessage(
        setUpdateMembershipMessage,
        error.response?.data?.message || "Unable to load membership.",
        true
      );
    }
  };

  const handleUpdateMembership = async (event) => {
    event.preventDefault();

    if (!membershipLookup.trim()) {
      showResultMessage(setUpdateMembershipMessage, "Membership Number is mandatory.", true);
      return;
    }

    try {
      const { data } = await api.put(`/memberships/${membershipLookup.trim().toUpperCase()}`, {
        action: updateMembershipForm.action,
        extensionMonths: updateMembershipForm.extensionMonths
      });
      setLoadedMembership(data.membership);
      showResultMessage(setUpdateMembershipMessage, data.message);
    } catch (error) {
      showResultMessage(
        setUpdateMembershipMessage,
        error.response?.data?.message || "Unable to update membership.",
        true
      );
    }
  };

  const handleAddBook = async (event) => {
    event.preventDefault();

    if (
      !addBookForm.title.trim() ||
      !addBookForm.author.trim() ||
      !addBookForm.category.trim() ||
      !addBookForm.serialNumber.trim() ||
      !addBookForm.shelfLocation.trim()
    ) {
      showResultMessage(setAddBookMessage, "Enter all book details before confirming.", true);
      return;
    }

    try {
      await api.post("/books", addBookForm);
      setAddBookForm(bookDefaults);
      showResultMessage(setAddBookMessage, "Book created successfully.");
      await loadAdminData();
    } catch (error) {
      showResultMessage(
        setAddBookMessage,
        error.response?.data?.message || "Unable to create book.",
        true
      );
    }
  };

  const handleBookSelection = (bookId) => {
    setSelectedBookId(bookId);
    const selectedBook = books.find((book) => book._id === bookId);

    if (!selectedBook) {
      setUpdateBookForm(bookDefaults);
      return;
    }

    setUpdateBookForm({
      type: selectedBook.type,
      title: selectedBook.title,
      author: selectedBook.author,
      category: selectedBook.category,
      serialNumber: selectedBook.serialNumber,
      shelfLocation: selectedBook.shelfLocation
    });
  };

  const handleUpdateBook = async (event) => {
    event.preventDefault();

    if (
      !selectedBookId ||
      !updateBookForm.title.trim() ||
      !updateBookForm.author.trim() ||
      !updateBookForm.category.trim() ||
      !updateBookForm.serialNumber.trim() ||
      !updateBookForm.shelfLocation.trim()
    ) {
      showResultMessage(setUpdateBookMessage, "Enter all book details before confirming.", true);
      return;
    }

    try {
      await api.put(`/books/${selectedBookId}`, updateBookForm);
      showResultMessage(setUpdateBookMessage, "Book updated successfully.");
      await loadAdminData();
    } catch (error) {
      showResultMessage(
        setUpdateBookMessage,
        error.response?.data?.message || "Unable to update book.",
        true
      );
    }
  };

  const handleUserModeChange = (mode) => {
    setUserMode(mode);
    setSelectedUserId("");
    setUserForm(userDefaults);
    setUserMessage({ text: "", type: "success" });
  };

  const handleUserSelection = (userId) => {
    setSelectedUserId(userId);
    const selectedUser = users.find((entry) => entry.id === userId);

    if (!selectedUser) {
      setUserForm(userDefaults);
      return;
    }

    setUserForm({
      name: selectedUser.name,
      username: selectedUser.username,
      password: "",
      role: selectedUser.role,
      membershipNumber: selectedUser.membershipNumber || "",
      active: selectedUser.active
    });
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();

    if (!userForm.name.trim()) {
      showResultMessage(setUserMessage, "Name is mandatory.", true);
      return;
    }

    if (userMode === "new" && !userForm.password) {
      showResultMessage(setUserMessage, "All details are required for a new user.", true);
      return;
    }

    if (!userForm.username.trim()) {
      showResultMessage(setUserMessage, "Username is mandatory.", true);
      return;
    }

    if (userForm.role === "user" && !userForm.membershipNumber) {
      showResultMessage(setUserMessage, "Select a linked membership for the normal user.", true);
      return;
    }

    try {
      if (userMode === "new") {
        await api.post("/users", userForm);
        setUserForm(userDefaults);
        showResultMessage(setUserMessage, "User created successfully.");
      } else {
        if (!selectedUserId) {
          showResultMessage(setUserMessage, "Select an existing user first.", true);
          return;
        }

        await api.put(`/users/${selectedUserId}`, userForm);
        showResultMessage(setUserMessage, "User updated successfully.");
      }

      await loadAdminData();
    } catch (error) {
      showResultMessage(
        setUserMessage,
        error.response?.data?.message || "Unable to save user details.",
        true
      );
    }
  };

  return (
    <section className="page-card">
      <p className="eyebrow">Maintenance</p>
      <h2>Maintenance</h2>
      <p className="muted-text">
        Use these screens to create or update the memberships, books, and users required by the
        rest of the application.
      </p>

      <div className="section-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "addMembership" && (
        <form className="stack-form" onSubmit={handleAddMembership} noValidate>
          <div className="form-grid">
            <label className="field-group">
              <span>Name</span>
              <input
                type="text"
                value={addMembershipForm.name}
                onChange={(event) =>
                  setAddMembershipForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Email</span>
              <input
                type="email"
                value={addMembershipForm.email}
                onChange={(event) =>
                  setAddMembershipForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Phone</span>
              <input
                type="text"
                value={addMembershipForm.phone}
                onChange={(event) =>
                  setAddMembershipForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <label className="field-group full-span">
              <span>Address</span>
              <textarea
                rows="3"
                value={addMembershipForm.address}
                onChange={(event) =>
                  setAddMembershipForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="radio-row">
            <span>Duration</span>
            {[6, 12, 24].map((months) => (
              <label key={months}>
                <input
                  type="radio"
                  name="membershipPlan"
                  value={months}
                  checked={addMembershipForm.planMonths === String(months)}
                  onChange={(event) =>
                    setAddMembershipForm((current) => ({
                      ...current,
                      planMonths: event.target.value
                    }))
                  }
                />
                {months === 6 ? "6 months" : months === 12 ? "1 year" : "2 years"}
              </label>
            ))}
          </div>

          {renderMessage(addMembershipMessage)}
          <button className="btn primary" type="submit">
            Confirm Membership
          </button>
        </form>
      )}

      {activeTab === "updateMembership" && (
        <form className="stack-form" onSubmit={handleUpdateMembership} noValidate>
          <div className="lookup-row">
            <label className="field-group grow">
              <span>Membership Number</span>
              <input
                type="text"
                value={membershipLookup}
                onChange={(event) => setMembershipLookup(event.target.value)}
              />
            </label>
            <button className="btn secondary" type="button" onClick={handleMembershipLookup}>
              Load Membership
            </button>
          </div>

          {loadedMembership && (
            <div className="info-panel">
              <p>
                <strong>Name:</strong> {loadedMembership.name}
              </p>
              <p>
                <strong>Status:</strong> {loadedMembership.status}
              </p>
              <p>
                <strong>Expiry:</strong> {formatDate(loadedMembership.endDate)}
              </p>
            </div>
          )}

          <div className="radio-row">
            <span>Action</span>
            <label>
              <input
                type="radio"
                name="membershipAction"
                value="extend"
                checked={updateMembershipForm.action === "extend"}
                onChange={(event) =>
                  setUpdateMembershipForm((current) => ({ ...current, action: event.target.value }))
                }
              />
              Extend Membership
            </label>
            <label>
              <input
                type="radio"
                name="membershipAction"
                value="cancel"
                checked={updateMembershipForm.action === "cancel"}
                onChange={(event) =>
                  setUpdateMembershipForm((current) => ({ ...current, action: event.target.value }))
                }
              />
              Cancel Membership
            </label>
          </div>

          <div className="radio-row">
            <span>Extension</span>
            {[6, 12, 24].map((months) => (
              <label key={months}>
                <input
                  type="radio"
                  name="extensionMonths"
                  value={months}
                  checked={updateMembershipForm.extensionMonths === String(months)}
                  onChange={(event) =>
                    setUpdateMembershipForm((current) => ({
                      ...current,
                      extensionMonths: event.target.value
                    }))
                  }
                  disabled={updateMembershipForm.action !== "extend"}
                />
                {months === 6 ? "6 months" : months === 12 ? "1 year" : "2 years"}
              </label>
            ))}
          </div>

          {renderMessage(updateMembershipMessage)}
          <button className="btn primary" type="submit">
            Confirm Update
          </button>
        </form>
      )}

      {activeTab === "addBook" && (
        <form className="stack-form" onSubmit={handleAddBook} noValidate>
          <div className="radio-row">
            <span>Type</span>
            {["book", "movie"].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="addBookType"
                  value={type}
                  checked={addBookForm.type === type}
                  onChange={(event) =>
                    setAddBookForm((current) => ({ ...current, type: event.target.value }))
                  }
                />
                {type}
              </label>
            ))}
          </div>

          <div className="form-grid">
            <label className="field-group">
              <span>Title</span>
              <input
                type="text"
                value={addBookForm.title}
                onChange={(event) =>
                  setAddBookForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Author</span>
              <input
                type="text"
                value={addBookForm.author}
                onChange={(event) =>
                  setAddBookForm((current) => ({ ...current, author: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Category</span>
              <input
                type="text"
                value={addBookForm.category}
                onChange={(event) =>
                  setAddBookForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Serial Number</span>
              <input
                type="text"
                value={addBookForm.serialNumber}
                onChange={(event) =>
                  setAddBookForm((current) => ({ ...current, serialNumber: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Shelf Location</span>
              <input
                type="text"
                value={addBookForm.shelfLocation}
                onChange={(event) =>
                  setAddBookForm((current) => ({
                    ...current,
                    shelfLocation: event.target.value
                  }))
                }
              />
            </label>
          </div>

          {renderMessage(addBookMessage)}
          <button className="btn primary" type="submit">
            Confirm Book
          </button>
        </form>
      )}

      {activeTab === "updateBook" && (
        <form className="stack-form" onSubmit={handleUpdateBook} noValidate>
          <label className="field-group">
            <span>Select Existing Book</span>
            <select value={selectedBookId} onChange={(event) => handleBookSelection(event.target.value)}>
              <option value="">Choose a book or movie</option>
              {books.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title} ({book.serialNumber})
                </option>
              ))}
            </select>
          </label>

          <div className="radio-row">
            <span>Type</span>
            {["book", "movie"].map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="updateBookType"
                  value={type}
                  checked={updateBookForm.type === type}
                  onChange={(event) =>
                    setUpdateBookForm((current) => ({ ...current, type: event.target.value }))
                  }
                />
                {type}
              </label>
            ))}
          </div>

          <div className="form-grid">
            <label className="field-group">
              <span>Title</span>
              <input
                type="text"
                value={updateBookForm.title}
                onChange={(event) =>
                  setUpdateBookForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Author</span>
              <input
                type="text"
                value={updateBookForm.author}
                onChange={(event) =>
                  setUpdateBookForm((current) => ({ ...current, author: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Category</span>
              <input
                type="text"
                value={updateBookForm.category}
                onChange={(event) =>
                  setUpdateBookForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Serial Number</span>
              <input
                type="text"
                value={updateBookForm.serialNumber}
                onChange={(event) =>
                  setUpdateBookForm((current) => ({ ...current, serialNumber: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Shelf Location</span>
              <input
                type="text"
                value={updateBookForm.shelfLocation}
                onChange={(event) =>
                  setUpdateBookForm((current) => ({
                    ...current,
                    shelfLocation: event.target.value
                  }))
                }
              />
            </label>
          </div>

          {renderMessage(updateBookMessage)}
          <button className="btn primary" type="submit">
            Confirm Update
          </button>
        </form>
      )}

      {activeTab === "userManagement" && (
        <form className="stack-form" onSubmit={handleUserSubmit} noValidate>
          <div className="radio-row">
            <span>User Option</span>
            <label>
              <input
                type="radio"
                name="userMode"
                value="new"
                checked={userMode === "new"}
                onChange={(event) => handleUserModeChange(event.target.value)}
              />
              New User
            </label>
            <label>
              <input
                type="radio"
                name="userMode"
                value="existing"
                checked={userMode === "existing"}
                onChange={(event) => handleUserModeChange(event.target.value)}
              />
              Existing User
            </label>
          </div>

          {userMode === "existing" && (
            <label className="field-group">
              <span>Select User</span>
              <select value={selectedUserId} onChange={(event) => handleUserSelection(event.target.value)}>
                <option value="">Choose a user</option>
                {users.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} ({entry.username})
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="form-grid">
            <label className="field-group">
              <span>Name</span>
              <input
                type="text"
                value={userForm.name}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>Username</span>
              <input
                type="text"
                value={userForm.username}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, username: event.target.value }))
                }
              />
            </label>
            <label className="field-group">
              <span>{userMode === "new" ? "Password" : "Reset Password"}</span>
              <input
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={userMode === "new" ? "" : "Leave blank to keep current password"}
              />
            </label>
            {userForm.role === "user" && (
              <label className="field-group">
                <span>Linked Membership</span>
                <select
                  value={userForm.membershipNumber}
                  onChange={(event) =>
                    setUserForm((current) => ({
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
            )}
          </div>

          <div className="radio-row">
            <span>Role</span>
            {["admin", "user"].map((role) => (
              <label key={role}>
                <input
                  type="radio"
                  name="userRole"
                  value={role}
                  checked={userForm.role === role}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      role: event.target.value,
                      membershipNumber:
                        event.target.value === "user" ? current.membershipNumber : ""
                    }))
                  }
                />
                {role}
              </label>
            ))}
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={userForm.active}
              onChange={(event) =>
                setUserForm((current) => ({ ...current, active: event.target.checked }))
              }
            />
            Active user
          </label>

          {renderMessage(userMessage)}
          <button className="btn primary" type="submit">
            Confirm User
          </button>
        </form>
      )}
    </section>
  );
};

export default MaintenancePage;
