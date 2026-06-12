import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";
import "../../styles/admin.css";
import { FaFileAlt, FaClock, FaCheckCircle, FaChartBar, FaSearch, FaPaperclip, FaStar, FaCog, FaUsers, FaCalendarAlt, FaEye, FaEdit, FaPlus, FaArrowLeft } from "react-icons/fa";

const InstructorAssignments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    deadline: "", 
    maxScore: 100, 
    allowResubmit: true 
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
  const [toast, setToast] = useState(null);
  const [filterTab, setFilterTab] = useState("All Assignments");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const { data } = await api.get("/courses/my");
      setCourses(data.courses || []);
    } catch (err) {
      console.error("Failed to load courses", err);
      setToast({ type: "error", message: "Failed to load your courses" });
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/assignments/my");
      let allAssignments = data.assignments || [];
      // Filter by selected course if one is selected
      if (selectedCourse) {
        allAssignments = allAssignments.filter(
          (a) => String(a.course?._id || a.course) === String(selectedCourse)
        );
      }
      setAssignments(allAssignments);
    } catch (err) {
      console.error("Failed to load assignments", err);
      setToast({ type: "error", message: "Failed to load assignments" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", description: "", deadline: "", maxScore: 100, allowResubmit: true });
    setFormError("");
    setEditingAssignment(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const openEditForm = (assignment) => {
    setEditingAssignment(assignment);
    setForm({
      title: assignment.title,
      description: assignment.description || "",
      deadline: assignment.deadline ? new Date(assignment.deadline).toISOString().slice(0, 16) : "",
      maxScore: assignment.maxScore || 100,
      allowResubmit: assignment.allowResubmit !== false,
    });
    setFormError("");
    setShowCreateForm(true);
  };

  const handleCreateSubmit = async () => {
    setFormError("");
    if (!form.title || !form.deadline) {
      setFormError("Title and deadline are required.");
      return;
    }
    const courseId = selectedCourse || (courses.length > 0 ? courses[0].id : null);
    if (!courseId) {
      setFormError("Please select a course first.");
      return;
    }
    setSaving(true);
    try {
      if (editingAssignment) {
        await api.patch(`/assignments/${editingAssignment._id}`, {
          title: form.title,
          description: form.description,
          deadline: form.deadline,
          maxScore: form.maxScore,
          allowResubmit: form.allowResubmit,
        });
        setToast({ type: "success", message: "Assignment updated successfully" });
      } else {
        await api.post("/assignments", {
          ...form,
          courseId,
        });
        setToast({ type: "success", message: "Assignment created successfully" });
      }
      setShowCreateForm(false);
      resetForm();
      loadAssignments();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to save assignment.";
      setFormError(errorMsg);
      setToast({ type: "error", message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (gradeForm.score === "" || gradeForm.score === undefined) {
      setToast({ type: "error", message: "Please enter a score" });
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/assignments/${viewingSubmissions._id}/grade`, {
        studentId: gradingSubmission.student?._id || gradingSubmission.student,
        score: parseInt(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      setGradingSubmission(null);
      setGradeForm({ score: "", feedback: "" });
      setToast({ type: "success", message: "Grade saved and student notified" });
      // Reload to reflect changes
      loadAssignments();
      // Refresh the submissions view
      const { data } = await api.get(`/assignments/${viewingSubmissions._id}`);
      if (data.assignment) {
        setViewingSubmissions(data.assignment);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to save grade.";
      setToast({ type: "error", message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const openGrading = (submission) => {
    setGradingSubmission(submission);
    setGradeForm({
      score: submission.status === "graded" ? submission.score : "",
      feedback: submission.feedback || "",
    });
  };

  // Stats
  const totalAssignments = assignments.length;
  const pendingReview = assignments.reduce((acc, a) => acc + (a.submissions?.filter(s => s.status === 'pending')?.length || 0), 0);
  const totalSubmissions = assignments.reduce((acc, a) => acc + (a.submissions?.length || 0), 0);
  const gradedCount = assignments.reduce((acc, a) => acc + (a.submissions?.filter(s => s.status === 'graded')?.length || 0), 0);
  const avgScore = gradedCount > 0 
    ? Math.round(assignments.reduce((acc, a) => {
        const scores = a.submissions?.filter(s => s.status === 'graded').map(s => s.score) || [];
        return acc + scores.reduce((sum, score) => sum + score, 0);
      }, 0) / gradedCount)
    : 0;

  // Filtering & sorting
  let filteredAssignments = assignments.filter((a) => {
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    const isExpired = new Date() > new Date(a.deadline);
    if (filterTab === "Active" && isExpired) return false;
    if (filterTab === "Expired" && !isExpired) return false;
    if (filterTab === "Has Submissions" && (!a.submissions || a.submissions.length === 0)) return false;
    if (filterTab === "Needs Grading" && !a.submissions?.some(s => s.status === "pending")) return false;
    return true;
  });

  // Sort
  filteredAssignments = [...filteredAssignments].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "submissions") return (b.submissions?.length || 0) - (a.submissions?.length || 0);
    return 0;
  });

  const currentCourse = courses.find(c => c.id === selectedCourse);

  return (
    <DashboardLayout title="Assignments">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="instructor-page-container">
        {showCreateForm ? (
          <div className="create-assignment-page">
            <div className="instructor-header" style={{ marginBottom: "24px" }}>
              <div className="instructor-header__content">
                <h2>{editingAssignment ? "Edit Assignment" : "Create New Assignment"}</h2>
                <p>{editingAssignment ? "Update the assignment details below." : "Create and configure a new assignment for your students."}</p>
              </div>
              <button type="button" className="btn btn--outline" onClick={() => { setShowCreateForm(false); resetForm(); }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaArrowLeft /> Back to List
              </button>
            </div>
            
            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon"><FaFileAlt /></span>
                <div>
                  <h3 className="form-section-title">Basic Information</h3>
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="title" className="form-field__label">Assignment Title *</label>
                <input id="title" type="text" className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 3 Discussion" />
              </div>

              <div className="form-field" style={{ marginTop: "16px" }}>
                <label htmlFor="course" className="form-field__label">Course *</label>
                <select id="course" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="form-input" disabled={!!editingAssignment}>
                  <option value="">Select a course</option>
                  {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
                </select>
              </div>
              
              <div className="form-field" style={{ marginTop: "16px" }}>
                <label htmlFor="description" className="form-field__label">Description</label>
                <textarea id="description" className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Write clear instructions for the assignment..." rows={5} />
              </div>

              <div className="form-row" style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="maxScore" className="form-field__label">Total Marks</label>
                  <input id="maxScore" type="number" className="form-input" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) || 100 })} min="1" />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="deadline" className="form-field__label">Due Date *</label>
                  <input id="deadline" type="datetime-local" className="form-input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon"><FaCog /></span>
                <div>
                  <h3 className="form-section-title">Settings</h3>
                </div>
              </div>
              <div style={{ display: "flex", gap: "24px" }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.allowResubmit} onChange={(e) => setForm({ ...form, allowResubmit: e.target.checked })} /> Allow resubmissions
                </label>
              </div>
            </div>

            {formError && <div className="form-error" style={{ marginBottom: "16px" }}>{formError}</div>}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", marginBottom: "24px" }}>
              <button type="button" className="btn btn--outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleCreateSubmit} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {saving ? "Saving..." : editingAssignment ? "Update Assignment" : "Publish Assignment"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="instructor-header" style={{ marginBottom: "24px" }}>
              <div className="instructor-header__content">
                <p>Create, manage and evaluate assignments for your students.</p>
              </div>
              <button type="button" className="btn btn--primary btn--lg" onClick={openCreateForm} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaPlus /> Create Assignment
              </button>
            </div>

            <div className="stat-card-row">
              <div className="stat-card">
                <div className="stat-icon stat-icon--blue"><FaFileAlt /></div>
                <div className="stat-content">
                  <span>Total Assignments</span>
                  <div className="stat-value">{totalAssignments}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon--orange"><FaClock /></div>
                <div className="stat-content">
                  <span>Pending Review</span>
                  <div className="stat-value">{pendingReview}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon--green"><FaUsers /></div>
                <div className="stat-content">
                  <span>Total Submissions</span>
                  <div className="stat-value">{totalSubmissions}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon--purple"><FaChartBar /></div>
                <div className="stat-content">
                  <span>Average Score</span>
                  <div className="stat-value">{avgScore}%</div>
                </div>
              </div>
            </div>

            <div className="dashboard-two-col" style={{ gridTemplateColumns: "1fr" }}>
              <div className="dashboard-main">
                <div className="search-filter-row">
                  <div className="page-tabs">
                    {["All Assignments", "Active", "Expired", "Has Submissions", "Needs Grading"].map(tab => (
                      <button key={tab} className={`tab-item ${filterTab === tab ? "tab-item--active" : ""}`} onClick={() => setFilterTab(tab)}>{tab}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <select 
                      value={selectedCourse} 
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="form-input"
                      style={{ width: "180px", padding: "8px 12px" }}
                    >
                      <option value="">All Courses</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="form-input"
                      style={{ width: "160px", padding: "8px 12px" }}
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="oldest">Sort: Oldest</option>
                      <option value="deadline">Sort: Deadline</option>
                      <option value="title">Sort: Title</option>
                      <option value="submissions">Sort: Submissions</option>
                    </select>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <FaSearch style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
                      <input type="text" placeholder="Search assignments..." className="form-input" style={{ width: "240px", paddingLeft: "36px" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state"><p>Loading assignments...</p></div>
                ) : assignments.length === 0 ? (
                  <div className="empty-state">
                    <h3>No assignments yet</h3>
                    <p>{selectedCourse ? `Create your first assignment for "${currentCourse?.title}" to get started.` : "Select a course or create your first assignment."}</p>
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="empty-state">
                    <h3>No assignments match your filters</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  <div className="assignments-list">
                    {filteredAssignments.map((assignment) => {
                      const subs = assignment.submissions || [];
                      const totalSubs = subs.length;
                      const gradedSubs = subs.filter(s => s.status === "graded").length;
                      const pendingSubs = subs.filter(s => s.status === "pending").length;
                      const isExpired = new Date() > new Date(assignment.deadline);
                      let statusClass = "status-badge--inprogress";
                      let statusText = "Active";
                      if (isExpired) { statusClass = "status-badge--completed"; statusText = "Expired"; }

                      return (
                        <div key={assignment._id} className="list-card">
                          <div className="list-card-icon list-card-icon--green"><FaFileAlt size={20} /></div>
                          <div className="list-card-content">
                            <h3 className="list-card-title">{assignment.title}</h3>
                            <p className="list-card-subtitle">{assignment.course?.title || "Course"} {assignment.maxScore ? `· ${assignment.maxScore} marks` : ""}</p>
                            <div className="list-card-meta">
                              <div className="list-card-meta-item">
                                <FaUsers style={{ marginRight: "4px" }} /> Submissions: <strong style={{ color: "var(--green-700)", marginLeft: "4px" }}>{totalSubs}</strong>
                                {pendingSubs > 0 && <span style={{ color: "#e67e22", marginLeft: "6px", fontSize: "12px" }}>({pendingSubs} pending)</span>}
                              </div>
                              <div className="list-card-meta-item">
                                <FaCheckCircle style={{ marginRight: "4px" }} /> Graded: <strong style={{ marginLeft: "4px" }}>{gradedSubs}/{totalSubs}</strong>
                              </div>
                              <div className="list-card-meta-item" style={{ color: isExpired ? "#d32f2f" : "inherit" }}>
                                <FaCalendarAlt style={{ marginRight: "4px" }} /> Due: {new Date(assignment.deadline).toLocaleDateString()} {new Date(assignment.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>

                          <div className="list-card-status">
                            <span className={`status-badge ${statusClass}`}>{statusText}</span>
                          </div>

                          <div className="list-card-action" style={{ display: "flex", gap: "8px" }}>
                            <button type="button" className="btn btn--outline btn--sm" onClick={() => openEditForm(assignment)} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <FaEdit /> Edit
                            </button>
                            <button type="button" className="btn btn--primary btn--sm" onClick={() => setViewingSubmissions(assignment)} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <FaEye /> Submissions ({totalSubs})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* View Submissions Modal */}
      {viewingSubmissions && (
        <div className="modal-overlay" onClick={() => setViewingSubmissions(null)} role="presentation">
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="submissions-title"
            style={{ maxWidth: "950px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <div>
                <h3 id="submissions-title" style={{ margin: 0 }}>Submissions: {viewingSubmissions.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0 0" }}>
                  {viewingSubmissions.course?.title} · Max Score: {viewingSubmissions.maxScore} · Due: {new Date(viewingSubmissions.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="modal-body">
              {(!viewingSubmissions.submissions || viewingSubmissions.submissions.length === 0) ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 0" }}>
                  <FaUsers size={36} style={{ marginBottom: "12px", opacity: 0.4 }} />
                  <p style={{ fontSize: "15px" }}>No submissions yet for this assignment.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "12px 20px", flex: "1", minWidth: "120px" }}>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Total</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold" }}>{viewingSubmissions.submissions.length}</div>
                    </div>
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "12px 20px", flex: "1", minWidth: "120px" }}>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Graded</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "var(--green-600)" }}>{viewingSubmissions.submissions.filter(s => s.status === "graded").length}</div>
                    </div>
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "12px 20px", flex: "1", minWidth: "120px" }}>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Pending</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#e67e22" }}>{viewingSubmissions.submissions.filter(s => s.status === "pending").length}</div>
                    </div>
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "12px 20px", flex: "1", minWidth: "120px" }}>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Avg Score</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                        {(() => {
                          const graded = viewingSubmissions.submissions.filter(s => s.status === "graded");
                          return graded.length > 0 ? Math.round(graded.reduce((s, sub) => s + sub.score, 0) / graded.length) : "—";
                        })()}
                        {viewingSubmissions.submissions.some(s => s.status === "graded") && <span style={{ fontSize: "14px", fontWeight: "normal" }}>/{viewingSubmissions.maxScore}</span>}
                      </div>
                    </div>
                  </div>

                  <table className="submissions-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Submitted</th>
                        <th>Content</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingSubmissions.submissions.map((submission) => {
                        const isLateSubmission = new Date(submission.submittedAt) > new Date(viewingSubmissions.deadline);
                        return (
                          <tr key={submission._id}>
                            <td>
                              <strong>{submission.studentName || submission.student?.fullName || "Student"}</strong>
                              <br />
                              <small style={{ color: "var(--text-muted)" }}>{submission.studentEmail || submission.student?.email || ""}</small>
                            </td>
                            <td>
                              <div>{new Date(submission.submittedAt).toLocaleDateString()}</div>
                              <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                                {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                              {isLateSubmission && (
                                <div style={{ color: "#d32f2f", fontSize: "11px", fontWeight: 500, marginTop: "2px" }}>
                                  Late
                                </div>
                              )}
                            </td>
                            <td style={{ maxWidth: "200px" }}>
                              <div style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {submission.content ? submission.content.substring(0, 60) + (submission.content.length > 60 ? "..." : "") : "—"}
                              </div>
                              {submission.fileUrl && (
                                <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--green-600)" }}>
                                  <FaPaperclip style={{ marginRight: "2px" }} /> Attachment
                                </a>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${submission.status === "graded" ? "status-badge--graded" : "status-badge--pending"}`}>
                                {submission.status === "graded" ? "Graded" : "Pending"}
                              </span>
                            </td>
                            <td>
                              {submission.status === "graded" ? (
                                <strong>{submission.score}/{viewingSubmissions.maxScore}</strong>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>—</span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                onClick={() => openGrading(submission)}
                                style={{ display: "flex", alignItems: "center", gap: "4px" }}
                              >
                                <FaStar size={12} /> {submission.status === "graded" ? "Re-grade" : "Grade"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setViewingSubmissions(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradingSubmission && (
        <div className="modal-overlay" onClick={() => setGradingSubmission(null)} role="presentation">
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="grade-title"
            style={{ maxWidth: "560px", width: "100%" }}
          >
            <div className="modal-header">
              <h3 id="grade-title" style={{ margin: 0 }}>{gradingSubmission.status === "graded" ? "Update Grade" : "Grade Submission"}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0 0" }}>
                <strong>{gradingSubmission.studentName || gradingSubmission.student?.fullName}</strong> · {gradingSubmission.studentEmail || gradingSubmission.student?.email}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "4px 0 0 0" }}>
                Submitted: {new Date(gradingSubmission.submittedAt).toLocaleString()}
              </p>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: "20px", padding: "14px", backgroundColor: "var(--bg-elevated)", borderRadius: "8px", borderLeft: "3px solid var(--green-500)" }}>
                <h4 style={{ marginBottom: "10px", fontSize: "14px" }}>Submission Content:</h4>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>
                  {gradingSubmission.content || "No text content submitted."}
                </p>
                {gradingSubmission.fileUrl && (
                  <a href={gradingSubmission.fileUrl} target="_blank" rel="noreferrer" className="link-green" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "13px" }}>
                    <FaPaperclip /> View Attached File
                  </a>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="score" className="form-field__label">Score (0 - {viewingSubmissions?.maxScore || 100})</label>
                <input
                  id="score"
                  type="number"
                  className="form-input"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                  min="0"
                  max={viewingSubmissions?.maxScore || 100}
                  placeholder="Enter score..."
                />
              </div>

              <div className="form-field">
                <label htmlFor="feedback" className="form-field__label">Feedback (optional)</label>
                <textarea
                  id="feedback"
                  className="form-textarea"
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  placeholder="Provide constructive feedback to the student..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleGradeSubmit}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <FaCheckCircle /> {saving ? "Saving..." : "Save Grade"}
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setGradingSubmission(null)}
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

export default InstructorAssignments;
