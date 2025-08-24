import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SAPMarking.css';

const SAPMarking = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [mentorEmail, setMentorEmail] = useState(localStorage.getItem('mentorEmail') || '');
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch SAP form submissions for this mentor
  useEffect(() => {
    if (!mentorEmail) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/mentor/sap-submissions/${encodeURIComponent(mentorEmail)}`);
        const data = await res.json();
        
        if (res.ok) {
          setSubmissions(data);
        } else {
          console.error('Failed to fetch submissions:', data.message);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [mentorEmail]);

  // Handle marking individual sections
  const handleMarkChange = (sectionKey, fieldKey, value) => {
    setMarks(prev => ({
      ...prev,
      [`${sectionKey}_${fieldKey}`]: value
    }));
  };

  // Submit marks for a specific submission
  const handleSubmitMarks = async (submissionId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8080/api/mentor/update-sap-marks/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marks, mentorEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Marks updated successfully!');
        // Refresh submissions
        const updatedSubmissions = submissions.map(sub => 
          sub._id === submissionId ? { ...sub, mentorMarks: marks, status: 'reviewed' } : sub
        );
        setSubmissions(updatedSubmissions);
        setSelectedSubmission(null);
        setMarks({});
      } else {
        alert(data.message || 'Failed to update marks');
      }
    } catch (error) {
      console.error('Error updating marks:', error);
      alert('Error updating marks');
    } finally {
      setLoading(false);
    }
  };

  // Render activity section for marking
  const renderActivitySection = (sectionTitle, sectionData, sectionKey) => {
    if (!sectionData || !sectionData.values) return null;

    return (
      <div key={sectionKey} className="activity-marking-section">
        <h4>{sectionTitle}</h4>
        <div className="marking-table">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Student Value</th>
                <th>Mentor Marks</th>
              </tr>
            </thead>
            <tbody>
              {sectionData.values.map((field, idx) => (
                <tr key={idx}>
                  <td>{field.placeholder}</td>
                  <td>{field.value || '-'}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter marks"
                      value={marks[`${sectionKey}_${idx}`] || ''}
                      onChange={(e) => handleMarkChange(sectionKey, idx, e.target.value)}
                      className="marks-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="sap-marking-container">
      <nav className="nav-bar">
        <div className="nav-brand">
          <span className="brand-icon">👨‍🏫</span>
          <span className="brand-text">Mentor SAP Marking - Kongu Engineering College</span>
        </div>
        <div className="nav-links">
          <Link to="/home" className="nav-link">🏠 Dashboard</Link>
          <Link to="/sap-marking" className="nav-link active">📊 SAP Marking</Link>
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

      <div className="content-wrapper">
        <div className="header-section">
          <h1>SAP Form Submissions for Review</h1>
          <p>Mentor: {mentorEmail}</p>
        </div>

        {loading && <div className="loading">Loading...</div>}

        {!selectedSubmission ? (
          <div className="submissions-list">
            <h2>Pending SAP Form Submissions</h2>
            {submissions.length === 0 ? (
              <div className="no-submissions">
                <p>No SAP form submissions found for review.</p>
              </div>
            ) : (
              <div className="submissions-grid">
                {submissions.map((submission) => (
                  <div key={submission._id} className="submission-card">
                    <div className="student-info">
                      <h3>{submission.studentInfo?.studentName || 'Unknown Student'}</h3>
                      <p><strong>Email:</strong> {submission.studentInfo?.studentEmail}</p>
                      <p><strong>Roll Number:</strong> {submission.studentInfo?.rollNumber}</p>
                      <p><strong>Year:</strong> {submission.studentInfo?.year}</p>
                      <p><strong>Section:</strong> {submission.studentInfo?.section}</p>
                      <p><strong>Semester:</strong> {submission.studentInfo?.semester}</p>
                    </div>
                    <div className="submission-meta">
                      <p><strong>Status:</strong> 
                        <span className={`status ${submission.status}`}>
                          {submission.status || 'pending'}
                        </span>
                      </p>
                      <p><strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedSubmission(submission);
                        // Pre-fill existing marks if any
                        if (submission.mentorMarks) {
                          setMarks(submission.mentorMarks);
                        }
                      }}
                      className="review-btn"
                      disabled={loading}
                    >
                      {submission.status === 'reviewed' ? '✏️ Edit Marks' : '📝 Review & Mark'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="marking-interface">
            <div className="marking-header">
              <button 
                onClick={() => {
                  setSelectedSubmission(null);
                  setMarks({});
                }}
                className="back-btn"
              >
                ← Back to Submissions
              </button>
              <h2>Marking SAP Form - {selectedSubmission.studentInfo?.studentName}</h2>
            </div>

            <div className="student-details">
              <h3>Student Information</h3>
              <div className="info-grid">
                <p><strong>Name:</strong> {selectedSubmission.studentInfo?.studentName}</p>
                <p><strong>Email:</strong> {selectedSubmission.studentInfo?.studentEmail}</p>
                <p><strong>Roll Number:</strong> {selectedSubmission.studentInfo?.rollNumber}</p>
                <p><strong>Year:</strong> {selectedSubmission.studentInfo?.year}</p>
                <p><strong>Section:</strong> {selectedSubmission.studentInfo?.section}</p>
                <p><strong>Semester:</strong> {selectedSubmission.studentInfo?.semester}</p>
                <p><strong>Academic Year:</strong> {selectedSubmission.studentInfo?.academicYear}</p>
                <p><strong>Mentor Name:</strong> {selectedSubmission.studentInfo?.mentorName}</p>
              </div>
            </div>

            <div className="activity-sections">
              <h3>Activity Sections for Marking</h3>
              {selectedSubmission.tableData?.map((section, idx) => 
                renderActivitySection(section.section, section, `section_${idx}`)
              )}
            </div>

            <div className="marking-actions">
              <button 
                onClick={() => handleSubmitMarks(selectedSubmission._id)}
                className="submit-marks-btn"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Submit Marks'}
              </button>
            </div>

            {/* Proof Files Section */}
            {selectedSubmission.proofUrls && selectedSubmission.proofUrls.length > 0 && (
              <div className="proof-files">
                <h3>Proof Files</h3>
                <div className="proof-grid">
                  {selectedSubmission.proofUrls.map((url, idx) => (
                    <div key={idx} className="proof-item">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        📎 View Proof {idx + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SAPMarking;
