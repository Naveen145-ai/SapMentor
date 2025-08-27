import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './EventValidation.css';

const EventValidation = () => {
  const [mentorEmail, setMentorEmail] = useState(localStorage.getItem('mentorEmail') || '');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marksMap, setMarksMap] = useState({});
  const [noteMap, setNoteMap] = useState({});

  const eventCategories = [
    { key: 'paperPresentation', title: '📝 Paper Presentation', color: '#3b82f6' },
    { key: 'projectPresentation', title: '🔬 Project Presentation', color: '#10b981' },
    { key: 'technoManagerial', title: '💻 Techno Managerial Events', color: '#8b5cf6' },
    { key: 'sportsGames', title: '🏃‍♂️ Sports & Games', color: '#f59e0b' },
    { key: 'membership', title: '👥 Membership', color: '#ef4444' },
    { key: 'leadership', title: '👑 Leadership/Organizing Events', color: '#06b6d4' },
    { key: 'vacOnline', title: '📚 VAC/Online Courses', color: '#84cc16' },
    { key: 'projectPaper', title: '📄 Project to Paper/Patent/Copyright', color: '#f97316' },
    { key: 'gateExams', title: '🎯 GATE/CAT/Govt Exams', color: '#ec4899' },
    { key: 'internship', title: '💼 Placement and Internship', color: '#6366f1' },
    { key: 'entrepreneurship', title: '🚀 Entrepreneurship', color: '#14b8a6' },
    { key: 'miscellaneous', title: '🤝 Social Activities', color: '#64748b' }
  ];

  useEffect(() => {
    if (mentorEmail) {
      fetchSubmissions();
    }
  }, [mentorEmail]);

  const fetchSubmissions = async () => {
    if (!mentorEmail.trim()) {
      setError('Please enter your mentor email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:8080/api/sap/mentor/sap-submissions/${encodeURIComponent(mentorEmail)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubmissions(data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch submissions');
        setSubmissions([]);
      }
    } catch (err) {
      setError('Network error. Please check if the server is running.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const groupSubmissionsByEvent = () => {
    const grouped = {};
    eventCategories.forEach(category => {
      grouped[category.key] = [];
    });

    submissions.forEach(submission => {
      if (submission.activities && Array.isArray(submission.activities)) {
        submission.activities.forEach(activity => {
          const eventKey = activity.eventKey || 'miscellaneous';
          if (grouped[eventKey]) {
            grouped[eventKey].push({
              ...submission,
              currentActivity: activity
            });
          }
        });
      } else {
        // For total marks submissions or other types
        grouped['miscellaneous'].push(submission);
      }
    });

    return grouped;
  };

  const handleValidateSubmission = async (submissionId, activityIndex, marks, notes, isApproved) => {
    try {
      const response = await fetch(`http://localhost:8080/api/sap/mentor/update-sap-marks/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityIndex,
          marks: Number(marks) || 0,
          notes: notes || '',
          status: isApproved ? 'approved' : 'rejected'
        }),
      });

      const result = await response.json();
      if (response.ok) {
        // Refresh submissions
        fetchSubmissions();
        alert(`Submission ${isApproved ? 'approved' : 'rejected'} successfully!`);
        setSelectedSubmission(null);
      } else {
        alert(result.error || 'Failed to update submission');
      }
    } catch (error) {
      console.error(error);
      alert('Update failed');
    }
  };

  const openSubmissionModal = (submission) => {
    setSelectedSubmission(submission);
  };

  const closeSubmissionModal = () => {
    setSelectedSubmission(null);
    setMarksMap({});
    setNoteMap({});
  };

  const groupedSubmissions = groupSubmissionsByEvent();

  return (
    <div className="event-validation-container">
      <nav className="nav-bar">
        <div className="nav-brand">
          <span className="brand-icon">👨‍🏫</span>
          <span className="brand-text">Mentor Event Validation - Kongu Engineering College</span>
        </div>
        <div className="nav-links">
          <Link to="/home" className="nav-link">🏠 Home</Link>
          <Link to="/event-validation" className="nav-link active">✅ Event Validation</Link>
          <Link to="/sap-marking" className="nav-link">📊 SAP Marking</Link>
          <button 
            onClick={() => {
              localStorage.removeItem('mentorEmail');
              window.location.href = '/login';
            }}
            className="nav-link logout-btn"
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="validation-wrapper">
        <div className="validation-header">
          <h1>📋 Student Event Validation Dashboard</h1>
          <p>Review and validate student submissions organized by event categories</p>
        </div>

        {/* Mentor Email Input */}
        <div className="mentor-input-section">
          <div className="input-group">
            <input
              type="email"
              value={mentorEmail}
              onChange={(e) => setMentorEmail(e.target.value)}
              placeholder="Enter your mentor email"
              className="mentor-email-input"
            />
            <button 
              onClick={fetchSubmissions}
              disabled={loading}
              className="fetch-btn"
            >
              {loading ? '🔄 Loading...' : '📊 Load Submissions'}
            </button>
          </div>
          {error && <div className="error-message">❌ {error}</div>}
        </div>

        {/* Event Categories Grid */}
        {submissions.length > 0 && (
          <div className="events-grid">
            {eventCategories.map((category) => {
              const categorySubmissions = groupedSubmissions[category.key] || [];
              const pendingCount = categorySubmissions.filter(s => s.status !== 'approved' && s.status !== 'rejected').length;
              
              return (
                <div 
                  key={category.key} 
                  className="event-category-box"
                  style={{ borderColor: category.color }}
                >
                  <div className="category-header" style={{ backgroundColor: category.color }}>
                    <h3>{category.title}</h3>
                    <div className="category-stats">
                      <span className="total-count">{categorySubmissions.length}</span>
                      {pendingCount > 0 && (
                        <span className="pending-badge">{pendingCount} pending</span>
                      )}
                    </div>
                  </div>

                  <div className="submissions-list">
                    {categorySubmissions.length === 0 ? (
                      <div className="empty-category">
                        <span className="empty-icon">📭</span>
                        <p>No submissions</p>
                      </div>
                    ) : (
                      categorySubmissions.map((submission, index) => (
                        <div 
                          key={`${submission._id}-${index}`}
                          className={`submission-item ${submission.status || 'pending'}`}
                          onClick={() => openSubmissionModal(submission)}
                        >
                          <div className="submission-info">
                            <h4>{submission.studentName || 'Unknown Student'}</h4>
                            <p className="student-email">{submission.email}</p>
                            <p className="submission-date">
                              📅 {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                            {submission.currentActivity && (
                              <div className="activity-preview">
                                <p><strong>Event:</strong> {submission.currentActivity.eventTitle}</p>
                                {submission.currentActivity.totalMarks && (
                                  <p><strong>Student Marks:</strong> {submission.currentActivity.totalMarks}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className={`status-indicator ${submission.status || 'pending'}`}>
                            {submission.status === 'approved' ? '✅' : 
                             submission.status === 'rejected' ? '❌' : '⏳'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && submissions.length === 0 && mentorEmail && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No submissions found</h3>
            <p>No submissions have been assigned to this mentor email yet.</p>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="submission-modal" onClick={closeSubmissionModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Validate Submission</h3>
              <button className="close-btn" onClick={closeSubmissionModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="student-info">
                <h4>👤 Student Information</h4>
                <p><strong>Name:</strong> {selectedSubmission.studentName}</p>
                <p><strong>Email:</strong> {selectedSubmission.email}</p>
                <p><strong>Roll Number:</strong> {selectedSubmission.rollNumber}</p>
                <p><strong>Year:</strong> {selectedSubmission.year}</p>
                <p><strong>Section:</strong> {selectedSubmission.section}</p>
              </div>

              {selectedSubmission.currentActivity && (
                <div className="activity-details">
                  <h4>🎯 Activity Details</h4>
                  <p><strong>Event:</strong> {selectedSubmission.currentActivity.eventTitle}</p>
                  <p><strong>Event Key:</strong> {selectedSubmission.currentActivity.eventKey}</p>
                  
                  {selectedSubmission.currentActivity.eventData && (
                    <div className="event-data">
                      <h5>📊 Student Data:</h5>
                      <div className="data-grid">
                        {Object.entries(selectedSubmission.currentActivity.eventData.counts || {}).map(([key, value]) => (
                          <div key={key} className="data-item">
                            <span className="data-label">{key} (Count):</span>
                            <span className="data-value">{value}</span>
                          </div>
                        ))}
                        {Object.entries(selectedSubmission.currentActivity.eventData.studentMarks || {}).map(([key, value]) => (
                          <div key={key} className="data-item">
                            <span className="data-label">{key} (Marks):</span>
                            <span className="data-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.currentActivity.proofUrls && selectedSubmission.currentActivity.proofUrls.length > 0 && (
                    <div className="proof-files">
                      <h5>📎 Proof Files:</h5>
                      <div className="proof-grid">
                        {selectedSubmission.currentActivity.proofUrls.map((proofUrl, idx) => (
                          <div key={idx} className="proof-item">
                            <img
                              src={`http://localhost:8080${proofUrl}`}
                              alt={`Proof ${idx + 1}`}
                              className="proof-thumbnail"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div className="file-placeholder" style={{display: 'none'}}>
                              📄 File {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="validation-section">
                <h4>✅ Validation</h4>
                <div className="validation-inputs">
                  <div className="input-group">
                    <label>Mentor Marks:</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter marks"
                      value={marksMap[selectedSubmission._id] || ''}
                      onChange={(e) => setMarksMap(prev => ({
                        ...prev,
                        [selectedSubmission._id]: e.target.value
                      }))}
                      className="marks-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Notes (Optional):</label>
                    <textarea
                      placeholder="Add validation notes..."
                      value={noteMap[selectedSubmission._id] || ''}
                      onChange={(e) => setNoteMap(prev => ({
                        ...prev,
                        [selectedSubmission._id]: e.target.value
                      }))}
                      className="notes-textarea"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="validation-buttons">
                  <button 
                    onClick={() => handleValidateSubmission(
                      selectedSubmission._id,
                      0, // activity index
                      marksMap[selectedSubmission._id],
                      noteMap[selectedSubmission._id],
                      true
                    )}
                    className="approve-btn"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    onClick={() => handleValidateSubmission(
                      selectedSubmission._id,
                      0, // activity index
                      0, // no marks for rejected
                      noteMap[selectedSubmission._id],
                      false
                    )}
                    className="reject-btn"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventValidation;
