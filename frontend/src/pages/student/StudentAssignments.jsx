import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";
import { FaCheckCircle, FaClock, FaExclamationCircle, FaSearch, FaFilter, FaFileAlt } from "react-icons/fa";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [filterTab, setFilterTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({ content: "", fileUrl: "" });
  const [submissionError, setSubmissionError] = useState("");
  const [toast, setToast] = useState(null);

  const [viewingSubmission, setViewingSubmission] = useState(null);

  useEffect(() => {
    loadCourses();
    loadAssignments();
  }, []);

  const loadCourses = async () => {
    try {
      const { data } = await api.get("/enrollments/my");
      const activeCourses = data.enrollments
        ?.filter(e => e.status !== "wishlist")
        .map(e => e.course) || [];
      setCourses(activeCourses);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/assignments/my");
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
      setToast({ type: "error", message: "Failed to load assignments" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmissionError("");
    if (!submissionForm.content && !submissionForm.fileUrl) {
      setSubmissionError("Please provide content or upload a file.");
      return;
    }
    setSubmitting(selectedAssignment._id);
    try {
      await api.post(`/assignments/${selectedAssignment._id}/submit`, {
        content: submissionForm.content,
        fileUrl: submissionForm.fileUrl,
      });
      setSubmissionForm({ content: "", fileUrl: "" });
      setSelectedAssignment(null);
      setToast({ type: "success", message: "Assignment submitted successfully" });
      loadAssignments();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to submit assignment.";
      setSubmissionError(errorMsg);
      setToast({ type: "error", message: errorMsg });
    } finally {
      setSubmitting(null);
    }
  };

  const getSubmissionStatus = (assignment) => {
    const submission = assignment.submissions?.[0];
    if (!submission) return "not_submitted";
    return submission.status === "graded" ? "graded" : "pending";
  };

  const getSubmission = (assignment) => {
    return assignment.submissions?.[0] || null;
  };

  const isDeadlinePassed = (deadline) => {
    return new Date() > new Date(deadline);
  };

  const filteredAssignments = assignments.filter((a) => {
    // Filter by course
    if (selectedCourse && a.course?._id !== selectedCourse && a.course?.id !== selectedCourse) return false;
    
    // Filter by search
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Filter by tab
    const status = getSubmissionStatus(a);
    const deadlinePassed = isDeadlinePassed(a.deadline);
    
    if (filterTab === "Active" && (status === "graded" || deadlinePassed)) return false;
    if (filterTab === "Pending Review" && status !== "pending") return false;
    if (filterTab === "Completed" && status !== "graded") return false;
    if (filterTab === "Missed" && (!deadlinePassed || status !== "not_submitted")) return false;

    return true;
  });

  return (
    <DashboardLayout title="My Assignments">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="instructor-page-container">
        <div className="instructor-header" style={{ marginBottom: "24px" }}>
          <div className="instructor-header__content">
            <p>Complete your course assignments and track your progress</p>
          </div>
        </div>

        {/* Analytics Row */}
        <div className="stat-card-row" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <div className="stat-icon stat-icon--blue"><FaFileAlt /></div>
            <div className="stat-content">
              <span>Total Assignments</span>
              <div className="stat-value">{assignments.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--orange"><FaClock /></div>
            <div className="stat-content">
              <span>Pending Review</span>
              <div className="stat-value">{assignments.filter(a => getSubmissionStatus(a) === "pending").length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--green"><FaCheckCircle /></div>
            <div className="stat-content">
              <span>Completed / Graded</span>
              <div className="stat-value">{assignments.filter(a => getSubmissionStatus(a) === "graded").length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--purple"><FaFileAlt /></div>
            <div className="stat-content">
              <span>Average Grade</span>
              <div className="stat-value">
                {(() => {
                  const graded = assignments.filter(a => getSubmissionStatus(a) === "graded" && getSubmission(a)?.score !== undefined);
                  if (graded.length === 0) return "0%";
                  const totalPercent = graded.reduce((acc, a) => {
                    const sub = getSubmission(a);
                    return acc + (sub.score / a.maxScore) * 100;
                  }, 0);
                  return `${Math.round(totalPercent / graded.length)}%`;
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="search-filter-row">
            <div className="page-tabs">
              <button 
                className={`tab-item ${filterTab === "All" ? "tab-item--active" : ""}`}
                onClick={() => setFilterTab("All")}
              >All</button>
              <button 
                className={`tab-item ${filterTab === "Active" ? "tab-item--active" : ""}`}
                onClick={() => setFilterTab("Active")}
              >Active</button>
              <button 
                className={`tab-item ${filterTab === "Pending Review" ? "tab-item--active" : ""}`}
                onClick={() => setFilterTab("Pending Review")}
              >Pending Review</button>
              <button 
                className={`tab-item ${filterTab === "Completed" ? "tab-item--active" : ""}`}
                onClick={() => setFilterTab("Completed")}
              >Completed</button>
              <button 
                className={`tab-item ${filterTab === "Missed" ? "tab-item--active" : ""}`}
                onClick={() => setFilterTab("Missed")}
              >Missed</button>
            </div>
            
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="form-input"
                style={{ width: "180px", padding: "8px 12px" }}
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>
                ))}
              </select>
              
              <div style={{ position: "relative" }}>
                <FaSearch style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="Search assignments..." 
                  className="form-input" 
                  style={{ width: "220px", paddingLeft: "36px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <p>Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="empty-state">
              <h3>No assignments found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="assignments-list">
              {filteredAssignments.map((assignment) => {
                const status = getSubmissionStatus(assignment);
                const submission = getSubmission(assignment);
                const deadlinePassed = isDeadlinePassed(assignment.deadline);

                let statusClass = "";
                let statusIcon = null;
                let statusText = "";

                if (status === "graded") {
                  statusClass = "status-badge--completed";
                  statusText = "Graded";
                  statusIcon = <FaCheckCircle style={{ marginRight: "6px" }} />;
                } else if (status === "pending") {
                  statusClass = "status-badge--inprogress";
                  statusText = "Pending Review";
                  statusIcon = <FaClock style={{ marginRight: "6px" }} />;
                } else if (deadlinePassed) {
                  statusClass = "status-badge--late";
                  statusText = "Missed Deadline";
                  statusIcon = <FaExclamationCircle style={{ marginRight: "6px" }} />;
                } else {
                  statusClass = "";
                  statusText = "Active";
                  statusIcon = <FaClock style={{ marginRight: "6px" }} />;
                }

                return (
                  <div key={assignment._id} className="list-card">
                    <div className="list-card-icon list-card-icon--green">
                      <FaFileAlt size={20} />
                    </div>
                    <div className="list-card-content">
                      <h3 className="list-card-title">{assignment.title}</h3>
                      <p className="list-card-subtitle">{assignment.course?.title || "Course Name"}</p>
                      
                      <div className="list-card-meta">
                        <div className="list-card-meta-item">
                          <strong style={{ marginRight: "4px" }}>Max Score:</strong> {assignment.maxScore}
                        </div>
                        <div className="list-card-meta-item" style={{ color: deadlinePassed && !submission ? "#d32f2f" : "inherit" }}>
                          <strong style={{ marginRight: "4px" }}>Due:</strong> {new Date(assignment.deadline).toLocaleString()}
                        </div>
                        {submission && (
                          <div className="list-card-meta-item">
                            <strong style={{ marginRight: "4px" }}>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {submission?.status === "graded" && (
                        <div className="submission-feedback" style={{ marginTop: "12px", background: "var(--bg-elevated)", padding: "12px", borderRadius: "8px" }}>
                          <div className="feedback-score" style={{ marginBottom: "4px" }}>
                            <strong>Score: {submission.score}/{assignment.maxScore}</strong>
                          </div>
                          <p className="feedback-text" style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{submission.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="list-card-status">
                      <span className={`status-badge ${statusClass}`} style={{ display: "flex", alignItems: "center" }}>
                        {statusIcon} {statusText}
                      </span>
                    </div>

                    <div className="list-card-action" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {submission && (
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setViewingSubmission({ assignment, submission })}
                        >
                          View Submission
                        </button>
                      )}
                      {status === "not_submitted" ? (
                        deadlinePassed ? (
                          <span style={{ fontSize: "13px", color: "#d32f2f", fontWeight: 500 }}>
                            Late submission not allowed
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => setSelectedAssignment(assignment)}
                          >
                            Submit
                          </button>
                        )
                      ) : (
                        assignment.allowResubmit && !deadlinePassed && (
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            onClick={() => setSelectedAssignment(assignment)}
                          >
                            Resubmit
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedAssignment(null)} role="presentation">
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="submit-modal-title"
            style={{ maxWidth: "600px", width: "100%" }}
          >
            <div className="modal-header">
              <h3 id="submit-modal-title">Submit Assignment: {selectedAssignment.title}</h3>
            </div>

            <div className="modal-body">
              <div className="form-field">
                <label htmlFor="content" className="form-field__label">Assignment Content</label>
                <textarea
                  id="content"
                  className="form-textarea"
                  value={submissionForm.content}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, content: e.target.value })}
                  placeholder="Write your assignment response here..."
                  rows={6}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fileUrl" className="form-field__label">Attach File (Optional)</label>
                <input
                  id="fileUrl"
                  type="url"
                  className="form-input"
                  value={submissionForm.fileUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, fileUrl: e.target.value })}
                  placeholder="https://example.com/file.pdf"
                />
                <p className="form-field__hint">
                  Paste the URL of your file (PDF, Word, etc.)
                </p>
              </div>

              {submissionError && <div className="form-error">{submissionError}</div>}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={submitting === selectedAssignment._id}
              >
                {submitting === selectedAssignment._id ? "Submitting..." : "Submit Assignment"}
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setSelectedAssignment(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Submission Modal */}
      {viewingSubmission && (
        <div className="modal-overlay" onClick={() => setViewingSubmission(null)} role="presentation">
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="view-modal-title"
            style={{ maxWidth: "600px", width: "100%" }}
          >
            <div className="modal-header">
              <h3 id="view-modal-title">My Submission: {viewingSubmission.assignment.title}</h3>
            </div>

            <div className="modal-body">
              <div className="form-field" style={{ marginBottom: "16px" }}>
                <label className="form-field__label" style={{ fontWeight: "bold" }}>Submitted Content</label>
                <div style={{
                  background: "var(--bg-elevated, #f9fafb)",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #e5e7eb)",
                  minHeight: "100px",
                  whiteSpace: "pre-wrap"
                }}>
                  {viewingSubmission.submission.content || <em style={{ color: "var(--text-muted, #999)" }}>No text content submitted</em>}
                </div>
              </div>

              {viewingSubmission.submission.fileUrl && (
                <div className="form-field" style={{ marginBottom: "16px" }}>
                  <label className="form-field__label" style={{ fontWeight: "bold" }}>Attached File</label>
                  <div>
                    <a
                      href={viewingSubmission.submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--outline btn--sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                    >
                      <FaFileAlt /> Open Attached File Links
                    </a>
                  </div>
                </div>
              )}

              {viewingSubmission.submission.status === "graded" && (
                <div style={{ marginTop: "20px", padding: "16px", borderRadius: "8px", background: "#e8f5e9", border: "1px solid #c8e6c9" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#2e7d32" }}>Grading & Feedback</h4>
                  <p style={{ margin: "4px 0" }}><strong>Score:</strong> {viewingSubmission.submission.score} / {viewingSubmission.assignment.maxScore}</p>
                  {viewingSubmission.submission.feedback && (
                    <p style={{ margin: "8px 0 0 0", color: "#444" }}><strong>Feedback:</strong> {viewingSubmission.submission.feedback}</p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setViewingSubmission(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentAssignments;