import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";
import "../../styles/admin.css";
import {
  FaBrain,
  FaClock,
  FaCheckCircle,
  FaChartBar,
  FaSearch,
  FaUsers,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaPlus,
  FaTimesCircle,
  FaQuestionCircle,
} from "react-icons/fa";

const InstructorQuizzes = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }],
    passingScore: 70,
    dueDate: "",
    maxAttempts: 1,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterTab, setFilterTab] = useState("All Quizzes");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCourses();
    loadQuizzes();
  }, []);

  useEffect(() => {
    loadQuizzes();
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

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/quizzes/my");
      let allQuizzes = data.quizzes || [];
      if (selectedCourse) {
        allQuizzes = allQuizzes.filter(
          (q) => String(q.course?._id || q.course) === String(selectedCourse)
        );
      }
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error("Failed to load quizzes", err);
      setToast({ type: "error", message: "Failed to load quizzes" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: "", options: ["", "", "", ""], correctIndex: 0 },
      ],
    }));
  };

  const handleRemoveQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...form.questions];
    newQuestions[index][field] = value;
    setForm((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...form.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setForm((prev) => ({ ...prev, questions: newQuestions }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      questions: [{ question: "", options: ["", "", "", ""], correctIndex: 0 }],
      passingScore: 70,
      dueDate: "",
      maxAttempts: 1,
    });
    setFormError("");
    setEditingQuiz(null);
  };

  const handleCreateSubmit = async () => {
    setFormError("");
    if (!selectedCourse && !editingQuiz) {
      setFormError("Please select a course for this quiz.");
      return;
    }
    if (!form.title || !form.description) {
      setFormError("Title and description are required.");
      return;
    }
    if (form.questions.some((q) => !q.question || q.options.some((o) => !o))) {
      setFormError("All questions and options must be filled.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        courseId: selectedCourse,
        title: form.title,
        description: form.description,
        questions: form.questions,
        passingScore: form.passingScore,
        dueDate: form.dueDate,
        maxAttempts: form.maxAttempts,
      };

      if (editingQuiz) {
        await api.patch(`/quizzes/${editingQuiz._id}`, payload);
        setToast({ type: "success", message: "Quiz updated successfully" });
      } else {
        await api.post("/quizzes", payload);
        setToast({ type: "success", message: "Quiz created successfully" });
      }

      setShowCreateForm(false);
      resetForm();
      loadQuizzes();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || "Failed to save quiz.";
      setFormError(errorMsg);
      setToast({ type: "error", message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setForm({
      title: quiz.title || "",
      description: quiz.description || "",
      questions:
        quiz.questions?.length > 0
          ? quiz.questions.map((q) => ({
              question: q.question || "",
              options: q.options?.length === 4 ? [...q.options] : ["", "", "", ""],
              correctIndex: q.correctIndex || 0,
            }))
          : [{ question: "", options: ["", "", "", ""], correctIndex: 0 }],
      passingScore: quiz.passingScore || 70,
      dueDate: quiz.dueDate
        ? new Date(quiz.dueDate).toISOString().slice(0, 16)
        : "",
      maxAttempts: quiz.maxAttempts || 1,
    });
    setShowCreateForm(true);
  };

  const currentCourse = courses.find((c) => c.id === selectedCourse);
  const totalQuizzes = quizzes.length;
  const pendingReview = quizzes.reduce(
    (acc, q) =>
      acc +
      (q.submissions?.filter((s) => !s.reviewed)?.length || 0),
    0
  );
  const completedQuizzes = quizzes.filter(
    (q) => q.dueDate && new Date() > new Date(q.dueDate)
  ).length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(
          quizzes.reduce((acc, q) => {
            const scores =
              q.submissions?.map((s) => s.score) || [];
            const avg =
              scores.length
                ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                : 0;
            return acc + avg;
          }, 0) / totalQuizzes
        )
      : 0;

  const filteredQuizzes = quizzes.filter((q) => {
    if (
      searchQuery &&
      !q.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    const isExpired = q.dueDate && new Date() > new Date(q.dueDate);
    if (filterTab === "Active" && isExpired) return false;
    if (filterTab === "Expired" && !isExpired) return false;
    return true;
  });

  return (
    <DashboardLayout title="Quizzes">
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
                <h2>{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</h2>
                <p>
                  {editingQuiz
                    ? "Update your quiz details and questions."
                    : "Create and configure a new quiz for your students."}
                </p>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon">
                  <FaBrain />
                </span>
                <div>
                  <h3 className="form-section-title">1. Basic Information</h3>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="course" className="form-field__label">
                  Course *
                </label>
                <select
                  id="course"
                  value={selectedCourse || ""}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="form-input"
                  disabled={!!editingQuiz}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field" style={{ marginTop: "16px" }}>
                <label htmlFor="quiz-title" className="form-field__label">
                  Quiz Title *
                </label>
                <input
                  id="quiz-title"
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Chapter 3 Knowledge Check"
                />
              </div>

              <div className="form-field" style={{ marginTop: "16px" }}>
                <label htmlFor="quiz-description" className="form-field__label">
                  Description *
                </label>
                <textarea
                  id="quiz-description"
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe what this quiz covers..."
                  rows={5}
                />
              </div>

              <div
                className="form-row"
                style={{ marginTop: "16px", display: "flex", gap: "16px" }}
              >
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="passing-score" className="form-field__label">
                    Passing Score (%)
                  </label>
                  <input
                    id="passing-score"
                    type="number"
                    className="form-input"
                    value={form.passingScore}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        passingScore: parseInt(e.target.value),
                      })
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label htmlFor="max-attempts" className="form-field__label">
                    Max Attempts
                  </label>
                  <select
                    id="max-attempts"
                    className="form-input"
                    value={form.maxAttempts}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxAttempts: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={999}>Unlimited</option>
                  </select>
                </div>
              </div>

              <div className="form-field" style={{ marginTop: "16px" }}>
                <label htmlFor="due-date" className="form-field__label">
                  Due Date
                </label>
                <input
                  id="due-date"
                  type="datetime-local"
                  className="form-input"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon">
                  <FaQuestionCircle />
                </span>
                <div>
                  <h3 className="form-section-title">2. Questions</h3>
                </div>
              </div>

              {form.questions.map((question, qIndex) => (
                <div
                  key={qIndex}
                  style={{
                    padding: "20px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h5 style={{ margin: 0 }}>Question {qIndex + 1}</h5>
                    {form.questions.length > 1 && (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        style={{ color: "var(--error)" }}
                      >
                        <FaTimesCircle style={{ marginRight: "4px" }} />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-field">
                    <label className="form-field__label">Question Text *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "question", e.target.value)
                      }
                      placeholder="Enter the question..."
                    />
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Options (select the correct answer):
                    </label>
                    {question.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginBottom: "10px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctIndex === oIndex}
                          onChange={() =>
                            handleQuestionChange(
                              qIndex,
                              "correctIndex",
                              oIndex
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(qIndex, oIndex, e.target.value)
                          }
                          placeholder={`Option ${oIndex + 1}`}
                          style={{ flex: 1 }}
                        />
                        {question.correctIndex === oIndex && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--green-600)",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn--outline"
                onClick={handleAddQuestion}
                style={{ width: "100%", marginTop: "8px" }}
              >
                <FaPlus style={{ marginRight: "6px" }} />
                Add Question
              </button>
            </div>

            {formError && (
              <div className="form-error" style={{ marginBottom: "16px" }}>
                {formError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreateSubmit}
                disabled={saving}
              >
                {saving
                  ? "Publishing..."
                  : editingQuiz
                  ? "Update Quiz"
                  : "Publish Quiz"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="instructor-header"
              style={{ marginBottom: "24px" }}
            >
              <div className="instructor-header__content">
                <p>Create, manage and evaluate quizzes for your students.</p>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={() => {
                  resetForm();
                  setShowCreateForm(true);
                }}
              >
                + Create Quiz
              </button>
            </div>

            <div className="stat-card-row">
              <div className="stat-card">
                <div className="stat-icon stat-icon--blue">
                  <FaBrain />
                </div>
                <div className="stat-content">
                  <span>Total Quizzes</span>
                  <div className="stat-value">{totalQuizzes}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon--orange">
                  <FaClock />
                </div>
                <div className="stat-content">
                  <span>Pending Review</span>
                  <div className="stat-value">{pendingReview}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon--green">
                  <FaCheckCircle />
                </div>
                <div className="stat-content">
                  <span>Completed</span>
                  <div className="stat-value">{completedQuizzes}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon--purple">
                  <FaChartBar />
                </div>
                <div className="stat-content">
                  <span>Average Score</span>
                  <div className="stat-value">{avgScore}%</div>
                </div>
              </div>
            </div>

            <div
              className="dashboard-two-col"
              style={{ gridTemplateColumns: "1fr" }}
            >
              <div className="dashboard-main">
                <div className="search-filter-row">
                  <div className="page-tabs">
                    <button
                      className={`tab-item ${
                        filterTab === "All Quizzes" ? "tab-item--active" : ""
                      }`}
                      onClick={() => setFilterTab("All Quizzes")}
                    >
                      All Quizzes
                    </button>
                    <button
                      className={`tab-item ${
                        filterTab === "Active" ? "tab-item--active" : ""
                      }`}
                      onClick={() => setFilterTab("Active")}
                    >
                      Active
                    </button>
                    <button
                      className={`tab-item ${
                        filterTab === "Expired" ? "tab-item--active" : ""
                      }`}
                      onClick={() => setFilterTab("Expired")}
                    >
                      Expired
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ position: "relative" }}>
                      <FaSearch
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "12px",
                          color: "var(--text-muted)",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search quizzes..."
                        className="form-input"
                        style={{ width: "220px", paddingLeft: "36px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      className="form-input"
                      value={selectedCourse || ""}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      style={{ width: "200px" }}
                    >
                      <option value="">All Courses</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state">
                    <p>Loading quizzes...</p>
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="empty-state">
                    <h3>No quizzes yet</h3>
                    <p>
                      Create your first quiz for "{currentCourse?.title}" to get
                      started.
                    </p>
                  </div>
                ) : (
                  <div className="quizzes-list">
                    {filteredQuizzes.map((quiz) => {
                      const totalSubmissions =
                        quiz.submissions?.length || 0;
                      const questionCount = quiz.questions?.length || 0;
                      const isExpired =
                        quiz.dueDate &&
                        new Date() > new Date(quiz.dueDate);
                      const statusClass = isExpired
                        ? "status-badge--completed"
                        : "status-badge--inprogress";
                      const statusText = isExpired ? "Expired" : "Active";

                      return (
                        <div key={quiz._id} className="list-card">
                          <div className="list-card-icon list-card-icon--green">
                            <FaBrain size={20} />
                          </div>
                          <div className="list-card-content">
                            <h3 className="list-card-title">{quiz.title}</h3>
                            <p className="list-card-subtitle">
                              {currentCourse?.title || "Course Name"}
                            </p>
                            <div className="list-card-meta">
                              <div className="list-card-meta-item">
                                <FaQuestionCircle
                                  style={{ marginRight: "4px" }}
                                />
                                Questions:{" "}
                                <strong
                                  style={{
                                    color: "var(--green-700)",
                                    marginLeft: "4px",
                                  }}
                                >
                                  {questionCount}
                                </strong>
                              </div>
                              <div className="list-card-meta-item">
                                <FaUsers style={{ marginRight: "4px" }} />
                                Submissions:{" "}
                                <strong
                                  style={{
                                    color: "var(--green-700)",
                                    marginLeft: "4px",
                                  }}
                                >
                                  {totalSubmissions}
                                </strong>
                              </div>
                              <div className="list-card-meta-item">
                                <FaCalendarAlt
                                  style={{ marginRight: "4px" }}
                                />
                                Due:{" "}
                                {quiz.dueDate
                                  ? new Date(
                                      quiz.dueDate
                                    ).toLocaleDateString()
                                  : "No due date"}
                              </div>
                            </div>
                          </div>

                          <div className="list-card-status">
                            <span
                              className={`status-badge ${statusClass}`}
                            >
                              {statusText}
                            </span>
                          </div>

                          <div
                            className="list-card-action"
                            style={{ display: "flex", gap: "8px" }}
                          >
                            <button
                              type="button"
                              className="btn btn--outline btn--sm"
                              onClick={() => handleEditQuiz(quiz)}
                            >
                              <FaEdit style={{ marginRight: "4px" }} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn--outline btn--sm"
                              onClick={() => setViewingSubmissions(quiz)}
                            >
                              <FaEye style={{ marginRight: "4px" }} />
                              View Submissions
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
        <div
          className="modal-overlay"
          onClick={() => setViewingSubmissions(null)}
          role="presentation"
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="submissions-title"
            style={{
              maxWidth: "900px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div className="modal-header">
              <h3 id="submissions-title">
                Submissions: {viewingSubmissions.title}
              </h3>
            </div>

            <div className="modal-body">
              {viewingSubmissions.submissions?.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "32px 0",
                  }}
                >
                  No submissions yet
                </p>
              ) : (
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Submitted At</th>
                      <th>Score (%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSubmissions.submissions?.map((submission) => (
                      <tr key={submission._id}>
                        <td>
                          <strong>{submission.studentName}</strong>
                        </td>
                        <td>{submission.studentEmail}</td>
                        <td>
                          <div>
                            <div>
                              {new Date(
                                submission.submittedAt
                              ).toLocaleDateString()}
                            </div>
                            <small
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "11px",
                              }}
                            >
                              {new Date(
                                submission.submittedAt
                              ).toLocaleTimeString()}
                            </small>
                          </div>
                        </td>
                        <td>
                          <strong>{submission.score}%</strong>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              submission.passed
                                ? "status-badge--passed"
                                : "status-badge--failed"
                            }`}
                          >
                            {submission.passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    </DashboardLayout>
  );
};

export default InstructorQuizzes;