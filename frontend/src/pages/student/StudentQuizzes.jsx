import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FaCheckCircle, FaClipboardList, FaBullseye, FaChartBar, FaSearch, FaBrain, FaQuestionCircle, FaClock, FaCalendarAlt, FaTimesCircle } from "react-icons/fa";

const StudentQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [filterTab, setFilterTab] = useState("All Quizzes");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [taking, setTaking] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    loadCourses();
    loadQuizzes();
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

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/quizzes/my");
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoading(false);
    }
  };

  // Use mySubmission (set by backend sanitizeQuizForStudent) or first element from submissions
  const getMySubmission = (quiz) => {
    return quiz.mySubmission || quiz.submissions?.[0] || null;
  };

  const canTake = (quiz) => {
    const submission = getMySubmission(quiz);
    if (!submission) return true;
    if (quiz.maxAttempts === 1) return false;
    return true;
  };

  const handleSelectAnswer = (questionIndex, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/${taking._id}/submit`, { answers: Object.values(answers) });
      setShowResults({
        ...data.submission,
        questionsWithAnswers: data.questionsWithAnswers,
        passingScore: data.passingScore,
        totalQuestions: data.totalQuestions,
        quizId: taking._id,
        quizTitle: taking.title,
      });
      setTaking(null);
      setAnswers({});
      loadQuizzes();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const getQuizStatus = (quiz) => {
    const submission = getMySubmission(quiz);
    if (!submission) return "not_taken";
    return submission.passed ? "passed" : "failed";
  };

  const totalQuizzes = quizzes.length;
  const attemptedQuizzes = quizzes.filter(q => q.hasAttempted || q.mySubmission).length;
  const completedQuizzes = quizzes.filter(q => {
    const sub = getMySubmission(q);
    return sub && sub.passed;
  }).length;
  const avgScore = attemptedQuizzes > 0 
    ? Math.round(quizzes.reduce((acc, q) => acc + (getMySubmission(q)?.score || 0), 0) / attemptedQuizzes)
    : 0;

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedCourse && q.course?._id !== selectedCourse && q.course?.id !== selectedCourse) return false;
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    const status = getQuizStatus(q);
    
    if (filterTab === "Not Taken" && status !== "not_taken") return false;
    if (filterTab === "Passed" && status !== "passed") return false;
    if (filterTab === "Failed" && status !== "failed") return false;
    if (filterTab === "Attempted" && status === "not_taken") return false;
    
    return true;
  });

  return (
    <DashboardLayout title="Quizzes">
      <div className="instructor-header" style={{ marginBottom: "24px" }}>
        <div className="instructor-header__content">
          <p>Attempt quizzes, track your progress and improve your learning.</p>
        </div>
      </div>

      <div className="stat-card-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue"><FaClipboardList /></div>
          <div className="stat-content">
            <span>Total Quizzes</span>
            <div className="stat-value">{totalQuizzes}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--orange"><FaBullseye /></div>
          <div className="stat-content">
            <span>Attempted</span>
            <div className="stat-value">{attemptedQuizzes}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--green"><FaCheckCircle /></div>
          <div className="stat-content">
            <span>Passed</span>
            <div className="stat-value">{completedQuizzes}</div>
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

      <div className="search-filter-row">
        <div className="page-tabs">
          {["All Quizzes", "Not Taken", "Passed", "Failed", "Attempted"].map(tab => (
            <button 
              key={tab}
              className={`tab-item ${filterTab === tab ? "tab-item--active" : ""}`}
              onClick={() => setFilterTab(tab)}
            >{tab}</button>
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
              <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>
            ))}
          </select>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <FaSearch style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              placeholder="Search quizzes..." 
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
          <p>Loading quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="empty-state">
          <h3>No quizzes available</h3>
          <p>Try adjusting your search or filters, or check back later.</p>
        </div>
      ) : (
        <div className="quizzes-list">
          {filteredQuizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            const submission = getMySubmission(quiz);
            const canTakeQuiz = canTake(quiz);

            let statusClass = "status-badge--upcoming";
            let statusText = "Not Taken";
            let statusIcon = <FaClock style={{ marginRight: "4px" }} />;
            
            if (status === "passed") { 
              statusClass = "status-badge--completed"; 
              statusText = "Passed"; 
              statusIcon = <FaCheckCircle style={{ marginRight: "4px" }} />;
            } else if (status === "failed") { 
              statusClass = "status-badge--failed"; 
              statusText = "Failed"; 
              statusIcon = <FaTimesCircle style={{ marginRight: "4px" }} />;
            }

            return (
              <div key={quiz._id} className="list-card">
                <div className="list-card-icon list-card-icon--green">
                  <FaBrain size={20} />
                </div>
                <div className="list-card-content">
                  <h3 className="list-card-title">{quiz.title}</h3>
                  <p className="list-card-subtitle">{quiz.course?.title || "Course Name"}</p>
                  <div className="list-card-meta">
                    <div className="list-card-meta-item">
                      <FaQuestionCircle style={{ marginRight: "6px" }} /> {quiz.questions?.length || 0} Questions
                    </div>
                    <div className="list-card-meta-item">
                      <FaCalendarAlt style={{ marginRight: "6px" }} /> Due: {quiz.dueDate ? new Date(quiz.dueDate).toLocaleDateString() : "No deadline"}
                    </div>
                    {submission && (
                      <div className="list-card-meta-item">
                        <FaClock style={{ marginRight: "6px" }} /> Taken: {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="list-card-status">
                  <span className={`status-badge ${statusClass}`} style={{ display: "flex", alignItems: "center" }}>
                    {statusIcon} {statusText}
                  </span>
                  {submission && (
                    <div className="list-card-score" style={{ fontSize: "14px", marginTop: "8px", fontWeight: "bold" }}>
                      Score: {submission.score}%
                    </div>
                  )}
                </div>

                <div className="list-card-action">
                  {!submission ? (
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => { setTaking(quiz); setAnswers({}); setSubmitError(""); }}>
                      Start Quiz
                    </button>
                  ) : canTakeQuiz ? (
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => { setTaking(quiz); setAnswers({}); setSubmitError(""); }}>
                      Retake Quiz
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={async () => {
                        try {
                          const { data } = await api.get(`/quizzes/${quiz._id}`);
                          setShowResults({
                            ...submission,
                            questionsWithAnswers: data.quiz.questions,
                            passingScore: data.quiz.passingScore,
                            totalQuestions: data.quiz.questions.length,
                          });
                        } catch (err) {
                          console.error("Failed to load quiz results details", err);
                          setShowResults(submission); // fallback to simple view if api fails
                        }
                      }}
                    >
                      View Result
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz Taking Modal */}
      {taking && (
        <div className="modal-overlay" role="presentation" style={{ zIndex: 1000 }}>
          <div
            className="modal-card quiz-taking-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="quiz-modal-title"
            style={{ maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header sticky-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 id="quiz-modal-title">Quiz: {taking.title}</h3>
              <button
                type="button"
                className="icon-btn action-icon-btn--delete"
                onClick={() => setTaking(null)}
                title="Close quiz"
              >
                <FaTimesCircle />
              </button>
            </div>

            <div className="modal-body quiz-questions">
              {taking.questions?.map((question, qIndex) => (
                <div key={qIndex} className="quiz-question">
                  <h4>Question {qIndex + 1}</h4>
                  <p className="question-text">{question.question}</p>

                  <div className="question-options">
                    {question.options?.map((option, oIndex) => (
                      <label key={oIndex} className="option-label">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={answers[qIndex] === oIndex}
                          onChange={() => handleSelectAnswer(qIndex, oIndex)}
                        />
                        <span className="option-text">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {submitError && <div className="form-error" style={{ marginTop: "20px" }}>{submitError}</div>}
            </div>

            <div className="modal-footer sticky-footer">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmitQuiz}
                disabled={submitting || Object.keys(answers).length !== taking.questions?.length}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setTaking(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && (() => {
        // Find the quiz related to the submission if available, to get question text and details
        const quiz = quizzes.find(q => {
          if (showResults.quizId && q._id === showResults.quizId) return true;
          const sub = getMySubmission(q);
          return sub && (sub._id === showResults._id || sub.submittedAt === showResults.submittedAt);
        });

        // We can use questions from showResults.questionsWithAnswers (if direct from submit)
        // or from the quiz questions + submission answers
        const questionsList = showResults.questionsWithAnswers || quiz?.questions || [];
        
        // Match studentAnswers from showResults.detailedAnswers if available, fall back to showResults.answers or legacy submissions
        const detailedAnswersList = showResults.detailedAnswers || (quiz ? getMySubmission(quiz)?.detailedAnswers : []) || [];
        const studentAnswers = showResults.answers || (quiz ? getMySubmission(quiz)?.answers : []) || [];

        const quizTitle = showResults.quizTitle || quiz?.title || "Quiz Detail";
        const passingScore = showResults.passingScore || quiz?.passingScore || 70;

        return (
          <div className="modal-overlay" onClick={() => setShowResults(null)} role="presentation" style={{ zIndex: 1000 }}>
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="results-title"
              style={{ maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 id="results-title">Quiz Results: {quizTitle}</h3>
                <button
                  type="button"
                  className="icon-btn action-icon-btn--delete"
                  onClick={() => setShowResults(null)}
                  title="Close results"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "4px" }}
                >
                  <FaTimesCircle />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ textAlign: "center", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--border-color, #e5e7eb)" }}>
                  <div
                    className={`quiz-result-badge ${showResults.passed ? "passed" : "failed"}`}
                    style={{
                      fontSize: "36px",
                      fontWeight: "bold",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      color: showResults.passed ? "var(--text-success, #2e7d32)" : "var(--text-error, #d32f2f)"
                    }}
                  >
                    {showResults.passed ? <><FaCheckCircle /> Passed</> : <><FaTimesCircle /> Failed</>}
                  </div>

                  <div className="result-score" style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "8px" }}>
                    {showResults.score}%
                  </div>

                  <p style={{ color: "var(--text-secondary, #666)", fontSize: "15px", margin: 0 }}>
                    Passing Score: {passingScore}%
                  </p>
                </div>

                <div className="quiz-questions-breakdown" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h4 style={{ margin: "0 0 10px 0" }}>Question Review</h4>
                  {questionsList.map((question, qIndex) => {
                    // Find detailed record matching the current question ID
                    const detailedRecord = detailedAnswersList.find(d => String(d.questionId) === String(question._id));
                    
                    const studentAnsIndex = detailedRecord && detailedRecord.selectedAnswer !== undefined ? detailedRecord.selectedAnswer : (question.studentAnswer !== undefined ? question.studentAnswer : studentAnswers[qIndex]);
                    const correctAnsIndex = detailedRecord && detailedRecord.correctAnswer !== undefined ? detailedRecord.correctAnswer : (question.correctIndex !== undefined ? question.correctIndex : 0);
                    const isCorrect = detailedRecord && detailedRecord.isCorrect !== undefined ? detailedRecord.isCorrect : (studentAnsIndex !== undefined && studentAnsIndex !== null && correctAnsIndex !== undefined && correctAnsIndex !== null && Number(studentAnsIndex) === Number(correctAnsIndex));

                    return (
                      <div
                        key={qIndex}
                        style={{
                          padding: "16px 0",
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                          textAlign: "left"
                        }}
                      >
                        <h4 style={{ margin: "0 0 12px 0", color: "#111827", fontWeight: 600 }}>
                          {qIndex + 1}. {question.question}
                        </h4>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                          {question.options?.map((option, oIndex) => {
                            const oNum = Number(oIndex);
                            const studentAnsNum = studentAnsIndex !== undefined && studentAnsIndex !== null ? Number(studentAnsIndex) : -1;
                            const correctAnsNum = correctAnsIndex !== undefined && correctAnsIndex !== null ? Number(correctAnsIndex) : -1;

                            const isCurrentSelected = oNum === studentAnsNum;
                            const isCurrentCorrect = oNum === correctAnsNum;

                            let optionBg = "#ffffff";
                            let optionBorder = "1px solid #e5e7eb";
                            let optionColor = "#1f2937";

                            if (isCurrentCorrect) {
                              optionBg = "#d1fae5"; // Soft green background for correct options
                              optionBorder = "1px solid #10b981";
                            } else if (isCurrentSelected && !isCurrentCorrect) {
                              optionBg = "#fee2e2"; // Soft red background for wrong selected options
                              optionBorder = "1px solid #fca5a5";
                            }

                            return (
                              <div
                                key={oIndex}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "12px 16px",
                                  borderRadius: "8px",
                                  border: optionBorder,
                                  backgroundColor: optionBg,
                                  color: optionColor,
                                  fontSize: "14px",
                                  fontWeight: isCurrentSelected || isCurrentCorrect ? "500" : "normal"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <input
                                    type="radio"
                                    checked={isCurrentSelected}
                                    readOnly
                                    style={{
                                      accentColor: isCurrentCorrect ? "#10b981" : "#ef4444",
                                      cursor: "default"
                                    }}
                                  />
                                  <span>{option}</span>
                                </div>
                                {isCurrentCorrect && (
                                  <FaCheckCircle style={{ color: "#10b981", fontSize: "16px" }} />
                                )}
                                {isCurrentSelected && !isCurrentCorrect && (
                                  <FaTimesCircle style={{ color: "#ef4444", fontSize: "16px" }} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explicit text breakdown layout */}
                        <div style={{ marginTop: "12px", padding: "12px 16px", borderRadius: "8px", border: `1px solid ${isCorrect ? "#d1fae5" : "#fee2e2"}`, backgroundColor: isCorrect ? "#f0fdf4" : "#fef2f2", fontSize: "14px" }}>
                          <p style={{ margin: "4px 0" }}>
                            <strong>Your Answer:</strong> {studentAnsIndex !== undefined && studentAnsIndex !== null && Number(studentAnsIndex) >= 0 && question.options?.[Number(studentAnsIndex)] ? (
                              <span>
                                {question.options[Number(studentAnsIndex)]} {isCorrect ? "✅" : "❌"}
                              </span>
                            ) : (
                              <em style={{ color: "#9ca3af" }}>Not Attempted ❌</em>
                            )}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <strong>Correct Answer:</strong> {correctAnsIndex !== undefined && correctAnsIndex !== null && Number(correctAnsIndex) >= 0 && question.options?.[Number(correctAnsIndex)] ? (
                              <span>
                                {question.options[Number(correctAnsIndex)]} ✅
                              </span>
                            ) : (
                              <em style={{ color: "#9ca3af" }}>No Correct Answer Configured</em>
                            )}
                          </p>
                          <p style={{ margin: "8px 0 0 0", fontWeight: "600", color: isCorrect ? "#16a34a" : "#dc2626" }}>
                            Status: {isCorrect ? "Correct" : "Incorrect"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setShowResults(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
};

export default StudentQuizzes;