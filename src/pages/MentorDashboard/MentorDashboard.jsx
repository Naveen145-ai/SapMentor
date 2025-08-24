import React, { useState, useEffect } from 'react';
import './MentorDashboard.css';

const MentorDashboard = () => {
  const [mentorEmail, setMentorEmail] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [marksMap, setMarksMap] = useState({});
  const [noteMap, setNoteMap] = useState({});

  const fetchSubmissions = async () => {
    if (!mentorEmail.trim()) {
      setError('Please enter your mentor email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const encodedEmail = encodeURIComponent(mentorEmail.trim());
      const response = await fetch(`http://localhost:8080/api/mentor/submissions/${encodedEmail}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubmissions(data);
        calculateStats(data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch submissions');
        setSubmissions([]);
      }
    } catch (err) {
      setError('Network error. Please check if the server is running.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalSubmissions = data.length;
    const pendingCount = data.filter(s => s.status === 'pending').length;
    const acceptedCount = data.filter(s => s.status === 'accepted').length;
    const rejectedCount = data.filter(s => s.status === 'rejected').length;
    const totalMarks = data.reduce((sum, s) => sum + (s.marksAwarded || 0), 0);
    
    const categoryStats = {};
    data.forEach(s => {
      const cat = s.category || 'activity';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    setStats({
      totalSubmissions,
      pendingCount,
      acceptedCount,
      rejectedCount,
      totalMarks,
      categoryStats,
      uniqueStudents: [...new Set(data.map(s => s.email))].length
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const marksAwarded = Number(marksMap[id] || 0);
      const decisionNote = noteMap[id] || '';

      const response = await fetch(`http://localhost:8080/api/mentor/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, marksAwarded, decisionNote }),
      });

      const result = await response.json();
      if (response.ok) {
        setSubmissions(prev => prev.map(s => 
          s._id === id ? { ...s, status: newStatus, marksAwarded, decisionNote } : s
        ));
        alert('Status updated successfully!');
      } else {
        alert(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
      alert('Update failed');
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const exportToCSV = () => {
    if (submissions.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Student Name', 'Student Email', 'Activity', 'Category', 'Status', 'Marks Awarded', 'Decision Note', 'Submitted At'];
    const csvContent = [
      headers.join(','),
      ...submissions.map(sub => [
        `"${sub.name || 'Unknown'}"`,
        `"${sub.email}"`,
        `"${sub.activity}"`,
        `"${sub.category || 'activity'}"`,
        `"${sub.status}"`,
        sub.marksAwarded || 0,
        `"${sub.decisionNote || ''}"`,
        `"${new Date(sub.submittedAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mentor_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProofUrls = (submission) => {
    const urls = [];
    
    if (submission.proofUrl) {
      urls.push(submission.proofUrl);
    }
    
    if (submission.proofUrls && Array.isArray(submission.proofUrls)) {
      urls.push(...submission.proofUrls);
    }
    
    if (submission.events && Array.isArray(submission.events)) {
      submission.events.forEach(event => {
        if (event.proofUrls && Array.isArray(event.proofUrls)) {
          urls.push(...event.proofUrls);
        }
      });
    }
    
    return urls;
  };

  return (
    <div className="mentor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>👨‍🏫 Mentor Dashboard</h1>
        <p>Enter your email to view assigned submissions</p>
      </div>

      {/* Email Input Section */}
      <div className="email-input-section">
        <div className="input-group">
          <input
            type="email"
            value={mentorEmail}
            onChange={(e) => setMentorEmail(e.target.value)}
            placeholder="Enter your mentor email (e.g., mentor@kongu.edu)"
            className="email-input"
            onKeyPress={(e) => e.key === 'Enter' && fetchSubmissions()}
          />
          <button 
            onClick={fetchSubmissions}
            disabled={loading}
            className="fetch-btn"
          >
            {loading ? '🔄 Loading...' : '📊 Get My Submissions'}
          </button>
        </div>
        {error && <div className="error-message">❌ {error}</div>}
      </div>

      {/* Statistics */}
      {submissions.length > 0 && (
        <div className="stats-section">
          <h3>📈 Overview</h3>
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-number">{stats.totalSubmissions}</div>
              <div className="stat-label">Total Submissions</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-number">{stats.pendingCount}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-card accepted">
              <div className="stat-number">{stats.acceptedCount}</div>
              <div className="stat-label">Accepted</div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-number">{stats.rejectedCount}</div>
              <div className="stat-label">Rejected</div>
            </div>
            <div className="stat-card students">
              <div className="stat-number">{stats.uniqueStudents}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card marks">
              <div className="stat-number">{stats.totalMarks}</div>
              <div className="stat-label">Total Marks</div>
            </div>
          </div>
          
          {Object.keys(stats.categoryStats).length > 0 && (
            <div className="category-stats">
              <h4>📋 By Category</h4>
              <div className="category-chips">
                {Object.entries(stats.categoryStats).map(([category, count]) => (
                  <div key={category} className="category-chip">
                    <strong>{category}:</strong> {count}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={exportToCSV} className="export-btn">
            📊 Export to CSV
          </button>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length > 0 && (
        <div className="submissions-section">
          <h3>📝 Student Submissions ({submissions.length})</h3>
          <div className="submissions-grid">
            {submissions.map((submission) => (
              <div key={submission._id} className={`submission-card ${submission.status}`}>
                <div className="submission-header">
                  <h4>👤 {submission.name || 'Unknown Student'}</h4>
                  <span className={`status-badge ${submission.status}`}>
                    {submission.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="submission-details">
                  <p><strong>📧 Email:</strong> {submission.email}</p>
                  <p><strong>📋 Activity:</strong> {submission.activity}</p>
                  <p><strong>🏷️ Category:</strong> {submission.category || 'activity'}</p>
                  <p><strong>📅 Submitted:</strong> {new Date(submission.submittedAt).toLocaleDateString()}</p>
                  {submission.marksAwarded > 0 && (
                    <p><strong>⭐ Marks:</strong> {submission.marksAwarded}</p>
                  )}
                  {submission.decisionNote && (
                    <p><strong>📝 Note:</strong> {submission.decisionNote}</p>
                  )}
                </div>

                {/* Proof Images */}
                {(() => {
                  const proofUrls = getProofUrls(submission);
                  return proofUrls.length > 0 && (
                    <div className="proof-section">
                      <h5>📎 Proof Files ({proofUrls.length})</h5>
                      <div className="proof-grid">
                        {proofUrls.map((proofUrl, idx) => (
                          <div 
                            key={idx}
                            className="proof-thumbnail"
                            onClick={() => openImageModal(proofUrl)}
                          >
                            <img
                              src={`http://localhost:8080${proofUrl}`}
                              alt={`Proof ${idx + 1}`}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="file-placeholder" style={{display: 'none'}}>
                              📄 File {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Events Details */}
                {submission.events && submission.events.length > 0 && (
                  <div className="events-section">
                    <h5>🎯 Events ({submission.events.length})</h5>
                    {submission.events.map((event, idx) => (
                      <div key={idx} className="event-item">
                        <div className="event-header">
                          <strong>{event.title}</strong>
                          <span className={`event-status ${event.status || 'pending'}`}>
                            {(event.status || 'pending').toUpperCase()}
                          </span>
                        </div>
                        {event.values && Object.keys(event.values).length > 0 && (
                          <div className="event-values">
                            {Object.entries(event.values).map(([key, value]) => (
                              <span key={key} className="value-chip">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                {submission.status === 'pending' && (
                  <div className="action-section">
                    <div className="input-row">
                      <input
                        type="number"
                        placeholder="Marks"
                        value={marksMap[submission._id] || ''}
                        onChange={(e) => setMarksMap(prev => ({
                          ...prev,
                          [submission._id]: e.target.value
                        }))}
                        className="marks-input"
                      />
                      <input
                        type="text"
                        placeholder="Decision note (optional)"
                        value={noteMap[submission._id] || ''}
                        onChange={(e) => setNoteMap(prev => ({
                          ...prev,
                          [submission._id]: e.target.value
                        }))}
                        className="note-input"
                      />
                    </div>
                    <div className="button-row">
                      <button 
                        onClick={() => handleStatusChange(submission._id, 'accepted')}
                        className="accept-btn"
                      >
                        ✅ Accept
                      </button>
                      <button 
                        onClick={() => handleStatusChange(submission._id, 'rejected')}
                        className="reject-btn"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeImageModal}>✕</button>
            <img 
              src={`http://localhost:8080${selectedImage}`} 
              alt="Proof" 
              className="modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
