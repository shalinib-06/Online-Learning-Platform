import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";
import { FaSearch, FaFilter, FaPlus, FaEdit, FaArchive, FaTrash, FaDownload } from "react-icons/fa";

const generateUsername = (email) => {
  return email.split("@")[0].toLowerCase();
};

const generatePassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const EMPTY_FORM = { fullName: "", email: "", username: "", password: "", role: "student" };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showCreate, setShowCreate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [suspending, setSuspending] = useState(null);
  const [toast, setToast] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const load = () => {
    api
      .get("/admin/users", { params: { role, search } })
      .then(({ data }) => setUsers(data.users || []))
      .catch((err) => {
        setToast({ type: "error", message: "Failed to load users" });
      });
  };

  useEffect(() => {
    load();
  }, [role, search]);

  const validateForm = () => {
    const errors = {};
    
    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!form.username.trim()) {
      errors.username = "Username is required";
    } else if (form.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    if (showCreate === "create" && !form.password) {
      errors.password = "Password is required for new users";
    } else if (form.password && form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setValidationErrors({});
    setShowCreate("create");
  };

  const openEdit = (u) => {
    setForm({
      fullName: u.fullName || "",
      email: u.email || "",
      username: u.username || "",
      password: "",
      role: u.role || "student",
    });
    setFormError("");
    setValidationErrors({});
    setShowCreate(u);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setForm((prev) => ({
      ...prev,
      email,
      username: generateUsername(email),
      password: showCreate === "create" ? generatePassword() : prev.password,
    }));
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setFormError("");
    setSaving(true);
    try {
      if (showCreate === "create") {
        await api.post("/admin/users", form);
        setToast({ type: "success", message: "User created successfully! Welcome email sent." });
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.patch(`/admin/users/${showCreate._id}`, payload);
        setToast({ type: "success", message: "User updated successfully!" });
      }
      setShowCreate(null);
      load();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to save user.";
      setFormError(errorMsg);
      setToast({ type: "error", message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/admin/users/${deletingId}`);
      setDeletingId(null);
      setToast({ type: "success", message: "User deleted successfully" });
      load();
    } catch (err) {
      setToast({ type: "error", message: "Failed to delete user" });
    }
  };

  const toggleSuspend = async (userId, currentStatus) => {
    setSuspending(userId);
    try {
      await api.patch(`/admin/users/${userId}/suspend`, { suspend: !currentStatus });
      setToast({ type: "success", message: currentStatus ? "User activated" : "User suspended" });
      load();
    } catch (err) {
      setToast({ type: "error", message: "Failed to update suspension status" });
    } finally {
      setSuspending(null);
    }
  };

  const handleExport = () => {
    const csvRows = [
      ["Full Name", "Email", "Username", "Role", "Status", "Joined On"],
      ...filteredUsers.map(u => [
        `"${u.fullName || ""}"`,
        `"${u.email || ""}"`,
        `"${u.username || ""}"`,
        `"${u.role || ""}"`,
        `"${u.isSuspended ? "Suspended" : "Active"}"`,
        `"${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "12 May 2026"}"`
      ])
    ];
    const csvString = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isEditing = showCreate && showCreate !== "create";

  const getAvatarColor = (role) => {
    switch (role) {
      case "admin": return { bg: "#fce7f3", color: "#be185d" }; // Pink
      case "instructor": return { bg: "#e0f2fe", color: "#0284c7" }; // Blue
      default: return { bg: "#dcfce7", color: "#15803d" }; // Green
    }
  };

  const filteredUsers = users.filter((u) => {
    if (statusFilter === "active" && u.isSuspended) return false;
    if (statusFilter === "suspended" && !u.isSuspended) return false;
    return true;
  }).sort((a, b) => {
    if (sortOrder === "name") return a.fullName.localeCompare(b.fullName);
    if (sortOrder === "role") return a.role.localeCompare(b.role);
    if (sortOrder === "date") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0; // newest/oldest not implemented due to mock data createdAt
  });

  return (
    <DashboardLayout title="User Management">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="admin-page-container">
        <div className="admin-header" style={{ marginBottom: "24px" }}>
          <div className="admin-header__content">
            <p>Manage all users, roles, and account status</p>
          </div>
          <button type="button" className="btn btn--outline" onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaDownload /> Export Users
          </button>
        </div>

        <button type="button" className="btn btn--primary btn--lg" onClick={openCreate} style={{ marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#16a34a", borderColor: "#16a34a" }}>
          <FaPlus /> Add New User
        </button>

        <div className="admin-table-controls">
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <FaSearch style={{ position: "absolute", left: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ width: "300px", paddingLeft: "40px" }}
            />
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input" style={{ width: "160px" }}>
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input" style={{ width: "160px" }}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="form-input" style={{ width: "160px" }}>
              <option value="">Sort by: Default</option>
              <option value="name">Sort by: Name (A-Z)</option>
              <option value="role">Sort by: Role</option>
              <option value="date">Sort by: Date Joined</option>
            </select>
          </div>
        </div>

        <div className="admin-users-table-wrapper" style={{ overflowX: "auto" }}>
          <table className="admin-users-table" style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const avatar = getAvatarColor(u.role);
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ backgroundColor: avatar.bg, color: avatar.color }}>
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                          <strong>{u.fullName}</strong>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{u.username}</td>
                    <td>
                      <span className={`admin-role-badge admin-role-badge--${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <div className="admin-status-indicator">
                        <span className="status-dot" style={{ backgroundColor: u.isSuspended ? "#eab308" : u.isSuspended === false ? "#16a34a" : "#ef4444" }}></span>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "12 May 2026"}
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button className="action-icon-btn action-icon-btn--edit" onClick={() => openEdit(u)} title="Edit user">
                          <FaEdit />
                        </button>
                        <button className="action-icon-btn action-icon-btn--suspend" onClick={() => toggleSuspend(u._id, u.isSuspended)} disabled={suspending === u._id} title={u.isSuspended ? "Activate user" : "Suspend user"}>
                          <FaArchive />
                        </button>
                        <button className="action-icon-btn action-icon-btn--delete" onClick={() => setDeletingId(u._id)} title="Delete user">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 0" }}>
                    <p style={{ color: "var(--text-secondary)" }}>No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {filteredUsers.length > 10 && (
            <div className="admin-table-footer">
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Showing 1 to {filteredUsers.length} of {filteredUsers.length} users
              </span>
              <div className="pagination">
                <button className="page-btn">&lt;</button>
                <button className="page-btn page-btn--active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <span style={{ padding: "0 8px", color: "var(--text-muted)" }}>...</span>
                <button className="page-btn">16</button>
                <button className="page-btn">&gt;</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(null)} role="presentation">
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="user-modal-title"
            style={{ maxWidth: "520px", width: "100%" }}
          >
            <div className="modal-header">
              <h3 id="user-modal-title" style={{ marginBottom: "8px" }}>
                {isEditing ? "Edit User" : "Add New User"}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
                {isEditing
                  ? "Update user details. Leave password blank to keep current."
                  : "Create a new user account. A welcome email will be sent automatically."}
              </p>
            </div>

            <div className="modal-body">
              <div className="form-field">
                <label htmlFor="fullName" className="form-field__label">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  className={`form-input ${validationErrors.fullName ? "form-input--error" : ""}`}
                  value={form.fullName}
                  onChange={handleFormChange}
                  placeholder="e.g. Jane Doe"
                />
                {validationErrors.fullName && (
                  <span className="form-field__error">{validationErrors.fullName}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="email" className="form-field__label">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={`form-input ${validationErrors.email ? "form-input--error" : ""}`}
                  value={form.email}
                  onChange={handleEmailChange}
                  placeholder="jane@example.com"
                />
                {validationErrors.email && (
                  <span className="form-field__error">{validationErrors.email}</span>
                )}
                <p className="form-field__hint">Username and password will be auto-generated</p>
              </div>

              <div className="form-field">
                <label htmlFor="username" className="form-field__label">Username *</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  className={`form-input ${validationErrors.username ? "form-input--error" : ""}`}
                  value={form.username}
                  onChange={handleFormChange}
                  placeholder="Auto-generated from email"
                  readOnly
                />
                {validationErrors.username && (
                  <span className="form-field__error">{validationErrors.username}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="password" className="form-field__label">{isEditing ? "New Password (optional)" : "Password *"}</label>
                <input
                  id="password"
                  type="text"
                  name="password"
                  className={`form-input ${validationErrors.password ? "form-input--error" : ""}`}
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="Auto-generated"
                  readOnly
                />
                {validationErrors.password && (
                  <span className="form-field__error">{validationErrors.password}</span>
                )}
                <p className="form-field__hint">Unique password auto-generated for security</p>
              </div>

              <div className="form-field">
                <label htmlFor="role" className="form-field__label">Role *</label>
                <select 
                  name="role" 
                  id="role" 
                  className="form-input" 
                  value={form.role} 
                  onChange={handleFormChange}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formError && <div className="form-error">{formError}</div>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setShowCreate(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)} role="presentation">
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="delete-title"
            style={{ maxWidth: "420px" }}
          >
            <div className="modal-header">
              <h3 id="delete-title">Delete User?</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>This action cannot be undone.</p>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Are you sure you want to delete this user? All associated data will be permanently removed.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--primary btn--danger"
                onClick={confirmDelete}
              >
                Delete User
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;