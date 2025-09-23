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
        // Fetch all submissions (fullForm + individualEvents)
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${encodeURIComponent(mentorEmail)}`);
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

  // Mapping for known events to render structured table
  const getEventConfig = (key) => {
    if (key === 'paperPresentation') {
      return {
        title: '1. Paper Presentation',
        columns: [
          { key: 'insidePresented', label: 'Inside', points: 2 },
          { key: 'outsidePresented', label: 'Outside', points: 5 },
          { key: 'premierPresented', label: 'Premier', points: 10 },
          { key: 'insidePrize', label: 'Inside', points: 20 },
          { key: 'outsidePrize', label: 'Outside', points: 30 },
          { key: 'premierPrize', label: 'Premier', points: 50 }
        ],
        maxPoints: 75,
        headerGroups: [
          { title: 'Presented', span: 3 },
          { title: 'Prize', span: 3 }
        ]
      };
    }
    if (key === 'projectPresentation') {
      return {
        title: '2. Project Presentation',
        columns: [
          { key: 'insidePresented', label: 'Inside', points: 5 },
          { key: 'outsidePresented', label: 'Outside', points: 10 },
          { key: 'premierPresented', label: 'Premier', points: 20 },
          { key: 'insidePrize', label: 'Inside', points: 20 },
          { key: 'outsidePrize', label: 'Outside', points: 30 },
          { key: 'premierPrize', label: 'Premier', points: 50 }
        ],
        maxPoints: 100,
        headerGroups: [
          { title: 'Presented', span: 3 },
          { title: 'Prize', span: 3 }
        ]
      };
    }
    return null;
  };

  const renderStructuredEventTable = (ev) => {
    const cfg = getEventConfig(ev.key);
    if (!cfg) return null;
    const counts = ev.values?.counts || {};
    const studentMarks = ev.values?.studentMarks || {};
    const mentorMarks = ev.mentorMarks || {};
    return (
      <div className="activity-table">
        <table>
          <thead>
            <tr>
              <th rowSpan="2">Activity</th>
              {cfg.headerGroups.map((g, idx) => (
                <th key={idx} colSpan={g.span}>{g.title}</th>
              ))}
              <th rowSpan="2">Max Points</th>
            </tr>
            <tr>
              {cfg.columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{cfg.title}</td>
              {cfg.columns.map((c) => (
                <td key={`pt-${c.key}`}>{c.points}</td>
              ))}
              <td>{cfg.maxPoints}</td>
            </tr>
            <tr>
              <td>Count</td>
              {cfg.columns.map((c) => (
                <td key={`cnt-${c.key}`}>{String(counts[c.key] || 0)}</td>
              ))}
              <td></td>
            </tr>
            <tr>
              <td>Student marks (count x marks)</td>
              {cfg.columns.map((c) => (
                <td key={`sm-${c.key}`}>{String(studentMarks[c.key] || 0)}</td>
              ))}
              <td></td>
            </tr>
            <tr>
              <td>Mentor marks (count x marks)</td>
              {cfg.columns.map((c) => (
                <td key={`mm-${c.key}`}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Marks"
                    value={marks[`${ev.key}__${c.key}`] ?? mentorMarks[c.key] ?? ''}
                    onChange={(e) => setMarks(prev => ({ ...prev, [`${ev.key}__${c.key}`]: e.target.value }))}
                    className="marks-input"
                    style={{ width: '70px' }}
                  />
                </td>
              ))}
              <td></td>
            </tr>
            <tr>
              <td>Proof page number</td>
              {cfg.columns.map((c) => (
                <td key={`pp-${c.key}`}>-</td>
              ))}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Submit marks for a specific EVENT inside an individualEvents submission
  const handleSubmitEventMarks = async (submission, eventKey) => {
    try {
      setLoading(true);
      // Collect marks for the specific event from state (keys shaped as `${eventKey}__field`)
      const eventMarks = {};
      Object.entries(marks).forEach(([k, v]) => {
        const prefix = `${eventKey}__`;
        if (k.startsWith(prefix)) {
          const fieldKey = k.substring(prefix.length);
          eventMarks[fieldKey] = v;
        }
      });

      const res = await fetch(`http://localhost:8080/api/mentor/update-event-marks/${submission._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventKey, eventMarks, eventNote: '' })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Event marks updated successfully!');
        // Update local state for the selected submission
        const updated = submissions.map(s => {
          if (s._id !== submission._id) return s;
          const copy = { ...s };
          copy.events = (copy.events || []).map(ev => ev.key === eventKey ? { ...ev, mentorMarks: eventMarks, status: 'reviewed' } : ev);
          return copy;
        });
        setSubmissions(updated);
        const newSel = updated.find(s => s._id === submission._id);
        setSelectedSubmission(newSel);
      } else {
        alert(data.message || data.error || 'Failed to update event marks');
      }
    } catch (err) {
      console.error('Error updating event marks:', err);
      alert('Error updating event marks');
    } finally {
      setLoading(false);
    }
  };

  // Submit marks for a specific submission
  const handleSubmitMarks = async (submissionId) => {
    try {
      setLoading(true);
      // Use the correct backend route for updating marks on full-form submissions
      const res = await fetch(`http://localhost:8080/api/sap/mentor/update-sap-marks/${submissionId}`, {
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
                      <h3>{submission.details?.studentInfo?.studentName || 'Unknown Student'}</h3>
                      <p><strong>Email:</strong> {submission.details?.studentInfo?.studentEmail || submission.email}</p>
                      <p><strong>Roll Number:</strong> {submission.details?.studentInfo?.rollNumber}</p>
                      <p><strong>Year:</strong> {submission.details?.studentInfo?.year}</p>
                      <p><strong>Section:</strong> {submission.details?.studentInfo?.section}</p>
                      <p><strong>Semester:</strong> {submission.details?.studentInfo?.semester}</p>
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
                        if (submission.category === 'fullForm') {
                          if (submission.mentorMarks) {
                            setMarks(submission.mentorMarks);
                          } else {
                            setMarks({});
                          }
                        } else if (submission.category === 'individualEvents') {
                          // Build marks map from existing mentorMarks per event
                          const prefill = {};
                          (submission.events || []).forEach(ev => {
                            if (ev.mentorMarks) {
                              Object.entries(ev.mentorMarks).forEach(([k, v]) => {
                                prefill[`${ev.key}__${k}`] = v;
                              });
                            }
                          });
                          setMarks(prefill);
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
              <h2>
                {selectedSubmission.category === 'fullForm' 
                  ? `Marking SAP Form - ${selectedSubmission.details?.studentInfo?.studentName || 'Student'}`
                  : `Individual Events - ${selectedSubmission.name || selectedSubmission.details?.studentInfo?.studentName || 'Student'}`}
              </h2>
            </div>

            <div className="student-details">
              <h3>Student Information</h3>
              <div className="info-grid">
                <p><strong>Name:</strong> {selectedSubmission.details?.studentInfo?.studentName}</p>
                <p><strong>Email:</strong> {selectedSubmission.details?.studentInfo?.studentEmail || selectedSubmission.email}</p>
                <p><strong>Roll Number:</strong> {selectedSubmission.details?.studentInfo?.rollNumber}</p>
                <p><strong>Year:</strong> {selectedSubmission.details?.studentInfo?.year}</p>
                <p><strong>Section:</strong> {selectedSubmission.details?.studentInfo?.section}</p>
                <p><strong>Semester:</strong> {selectedSubmission.details?.studentInfo?.semester}</p>
                <p><strong>Academic Year:</strong> {selectedSubmission.details?.studentInfo?.academicYear}</p>
                <p><strong>Mentor Name:</strong> {selectedSubmission.details?.studentInfo?.mentorName}</p>
              </div>
            </div>

            {selectedSubmission.category === 'fullForm' ? (
              <>
                <div className="activity-sections">
                  <h3>Activity Sections for Marking</h3>
                  {selectedSubmission.details?.tableData?.map((section, idx) => 
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
              </>
            ) : (
              <div className="activity-sections">
                <h3>Student Submitted Events</h3>
                {(selectedSubmission.events || []).map((ev, eIdx) => (
                  <div key={ev.key || eIdx} className="activity-marking-section">
                    <h4>{ev.title || ev.key}</h4>
                    {/* Structured table for known events; fallback to generic */}
                    {renderStructuredEventTable(ev) || (
                      ev.values && (
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
                              {ev.values.counts && Object.entries(ev.values.counts).map(([k, v]) => (
                                <tr key={`cnt-${k}`}>
                                  <td>{k} (Count)</td>
                                  <td>{String(v || 0)}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Enter marks"
                                      value={marks[`${ev.key}__${k}`] || ''}
                                      onChange={(e) => setMarks(prev => ({ ...prev, [`${ev.key}__${k}`]: e.target.value }))}
                                      className="marks-input"
                                    />
                                  </td>
                                </tr>
                              ))}
                              {ev.values.studentMarks && Object.entries(ev.values.studentMarks).map(([k, v]) => (
                                <tr key={`mk-${k}`}>
                                  <td>{k} (Student Marks)</td>
                                  <td>{String(v || 0)}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Enter marks"
                                      value={marks[`${ev.key}__${k}`] || ''}
                                      onChange={(e) => setMarks(prev => ({ ...prev, [`${ev.key}__${k}`]: e.target.value }))}
                                      className="marks-input"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                    {ev.proofUrls && ev.proofUrls.length > 0 && (
                      <div className="proof-files">
                        <h5>Proof Files</h5>
                        <div className="proof-grid">
                          {ev.proofUrls.map((url, idx) => (
                            <div key={idx} className="proof-item">
                              <a href={`http://localhost:8080${url}`} target="_blank" rel="noopener noreferrer">📎 View Proof {idx + 1}</a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="marking-actions" style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => handleSubmitEventMarks(selectedSubmission, ev.key)}
                        className="submit-marks-btn"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : `Submit Marks for ${ev.title || ev.key}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
