import React, { useEffect, useState } from 'react';

const Home = () => {
  const [groupedSubmissions, setGroupedSubmissions] = useState({});
  const [filteredSubmissions, setFilteredSubmissions] = useState({});
  const [hasNew, setHasNew] = useState(false); // notification state
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [marksMap, setMarksMap] = useState({});
  const [noteMap, setNoteMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({});
  const mentorEmail = localStorage.getItem('mentorEmail') || 'mugilanks.23cse@kongu.edu';

  // Check for new/pending submissions (notification)
  useEffect(() => {
    if (!mentorEmail) return;

    const checkNew = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${mentorEmail}`);
        const data = await res.json();
        if (res.ok) {
          const pending = data.some((s) => s.status === 'pending');
          setHasNew(pending);
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkNew();

    const interval = setInterval(checkNew, 10000); // check every 10s
    return () => clearInterval(interval);
  }, [mentorEmail]);

  // Calculate statistics
  const calculateStats = (submissions) => {
    const allSubmissions = Object.values(submissions).flatMap(user => user.submissions);
    const totalSubmissions = allSubmissions.length;
    const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;
    const acceptedCount = allSubmissions.filter(s => s.status === 'accepted').length;
    const rejectedCount = allSubmissions.filter(s => s.status === 'rejected').length;
    const totalMarks = allSubmissions.reduce((sum, s) => sum + (s.marksAwarded || 0), 0);
    
    const categoryStats = {};
    allSubmissions.forEach(s => {
      const cat = s.category || 'activity';
      if (!categoryStats[cat]) categoryStats[cat] = 0;
      categoryStats[cat]++;
    });

    return {
      totalSubmissions,
      pendingCount,
      acceptedCount,
      rejectedCount,
      totalMarks,
      categoryStats,
      totalUsers: Object.keys(submissions).length
    };
  };

  // Filter and sort submissions
  const filterAndSortSubmissions = (submissions) => {
    let filtered = { ...submissions };
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([email, userData]) => {
          const emailMatch = email.toLowerCase().includes(searchLower);
          const nameMatch = userData.userName.toLowerCase().includes(searchLower);
          const activityMatch = userData.submissions.some(s => 
            s.activity.toLowerCase().includes(searchLower)
          );
          return emailMatch || nameMatch || activityMatch;
        })
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(filtered).map(([email, userData]) => [
          email,
          {
            ...userData,
            submissions: userData.submissions.filter(s => s.status === statusFilter)
          }
        ]).filter(([_, userData]) => userData.submissions.length > 0)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(filtered).map(([email, userData]) => [
          email,
          {
            ...userData,
            submissions: userData.submissions.filter(s => (s.category || 'activity') === categoryFilter)
          }
        ]).filter(([_, userData]) => userData.submissions.length > 0)
      );
    }

    // Sort submissions within each user group
    Object.values(filtered).forEach(userData => {
      userData.submissions.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.submittedAt) - new Date(a.submittedAt);
          case 'oldest':
            return new Date(a.submittedAt) - new Date(b.submittedAt);
          case 'status':
            const statusOrder = { pending: 0, accepted: 1, rejected: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
          case 'marks':
            return (b.marksAwarded || 0) - (a.marksAwarded || 0);
          default:
            return 0;
        }
      });
    });

    return filtered;
  };

  // Fetch submissions and group by email
  useEffect(() => {
    if (!mentorEmail) return;

    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${mentorEmail}`);
        const data = await res.json();

        if (res.ok) {
          const grouped = {};
          data.forEach(sub => {
            if (!grouped[sub.email]) {
              grouped[sub.email] = {
                submissions: [],
                userName: sub.userName || sub.name || 'Unknown User'
              };
            }
            grouped[sub.email].submissions.push(sub);
          });
          setGroupedSubmissions(grouped);
          setStats(calculateStats(grouped));
        } else {
          alert(data.message || 'No submissions found');
        }
      } catch (error) {
        console.error(error);
        alert('Failed to load submissions');
      }
    };

    fetchSubmissions();
  }, [mentorEmail]);

  // Update filtered submissions when filters change
  useEffect(() => {
    const filtered = filterAndSortSubmissions(groupedSubmissions);
    setFilteredSubmissions(filtered);
  }, [groupedSubmissions, searchTerm, statusFilter, categoryFilter, sortBy]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const marksAwarded = Number(marksMap[id] || 0);
      const decisionNote = noteMap[id] || '';

      const res = await fetch(`http://localhost:8080/api/mentor/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, marksAwarded, decisionNote }),
      });

      const result = await res.json();
      if (res.ok) {
        setGroupedSubmissions(prev => {
          const updated = { ...prev };
          for (let email in updated) {
            updated[email].submissions = updated[email].submissions.map(s => 
              s._id === id ? { ...s, status: newStatus, marksAwarded, decisionNote } : s
            );
          }
          return updated;
        });
      } else {
        alert(result.message || 'Failed to update');
      }
    } catch (error) {
      console.error(error);
      alert('Update failed');
    }
  };

  // Function to get all proof URLs from a submission
  const getProofUrls = (submission) => {
    const urls = [];
    
    // Check for single proofUrl
    if (submission.proofUrl) {
      urls.push(submission.proofUrl);
    }
    
    // Check for multiple proofUrls array
    if (submission.proofUrls && Array.isArray(submission.proofUrls)) {
      urls.push(...submission.proofUrls);
    }
    
    // Check for events with proofUrls
    if (submission.events && Array.isArray(submission.events)) {
      submission.events.forEach(event => {
        if (event.proofUrls && Array.isArray(event.proofUrls)) {
          urls.push(...event.proofUrls);
        }
      });
    }
    
    // Check for other proof-related fields
    Object.keys(submission).forEach(key => {
      if (key.includes('proof') && key.includes('Url') && submission[key] && !urls.includes(submission[key])) {
        urls.push(submission[key]);
      }
    });
    
    return urls;
  };

  // Handle individual event marking
  const handleEventMarking = async (submissionId, eventKey, eventMarks, eventNote) => {
    try {
      const res = await fetch(`http://localhost:8080/api/mentor/update-event-marks/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventKey, eventMarks, eventNote }),
      });

      const result = await res.json();
      if (res.ok) {
        // Update the local state
        setFilteredSubmissions(prev => {
          const updated = { ...prev };
          for (let email in updated) {
            updated[email].submissions = updated[email].submissions.map(s => {
              if (s._id === submissionId) {
                const updatedEvents = s.events.map(event => 
                  event.key === eventKey 
                    ? { ...event, mentorMarks: eventMarks, mentorNote: eventNote, status: 'reviewed' }
                    : event
                );
                return { ...s, events: updatedEvents };
              }
              return s;
            });
          }
          return updated;
        });
        alert('Event marks updated successfully!');
      } else {
        alert(result.message || 'Failed to update event marks');
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

  // Export functionality
  const exportToCSV = () => {
    const allSubmissions = Object.entries(filteredSubmissions).flatMap(([email, userData]) => 
      userData.submissions.map(submission => ({
        studentName: userData.userName,
        studentEmail: email,
        activity: submission.activity,
        category: submission.category || 'activity',
        status: submission.status,
        marksAwarded: submission.marksAwarded || 0,
        decisionNote: submission.decisionNote || '',
        submittedAt: new Date(submission.submittedAt).toLocaleDateString(),
        mentorDecisionAt: submission.mentorDecisionAt ? new Date(submission.mentorDecisionAt).toLocaleDateString() : ''
      }))
    );

    if (allSubmissions.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Student Name', 'Student Email', 'Activity', 'Category', 'Status', 'Marks Awarded', 'Decision Note', 'Submitted At', 'Decision Date'];
    const csvContent = [
      headers.join(','),
      ...allSubmissions.map(row => [
        `"${row.studentName}"`,
        `"${row.studentEmail}"`,
        `"${row.activity}"`,
        `"${row.category}"`,
        `"${row.status}"`,
        row.marksAwarded,
        `"${row.decisionNote}"`,
        `"${row.submittedAt}"`,
        `"${row.mentorDecisionAt}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `submissions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download SAP marks report
  const downloadSAPReport = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/mentor/sap-report/${mentorEmail}`);
      const reportData = await res.json();
      
      if (res.ok) {
        const students = Object.values(reportData);
        if (students.length === 0) {
          alert('No SAP marks data available');
          return;
        }

        const headers = ['Student Name', 'Student Email', 'Event', 'Event Title', 'Marks', 'Note', 'Total Marks'];
        const rows = [];
        
        students.forEach(student => {
          Object.entries(student.events).forEach(([eventKey, eventData]) => {
            rows.push([
              `"${student.studentName}"`,
              `"${student.studentEmail}"`,
              `"${eventKey}"`,
              `"${eventData.title}"`,
              eventData.marks,
              `"${eventData.note}"`,
              student.totalMarks
            ].join(','));
          });
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sap_marks_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Failed to generate SAP report');
      }
    } catch (error) {
      console.error(error);
      alert('Error downloading SAP report');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>👨‍🏫 Mentor Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              padding: '8px 16px',
              backgroundColor: showStats ? '#10b981' : '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={exportToCSV}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📊 Export CSV
            </button>
            <button
              onClick={downloadSAPReport}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📈 SAP Report
            </button>
          </div>
          <button
            onClick={() => {
              const section = document.getElementById('pending-section');
              if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
              } else {
                alert('No pending submissions right now.');
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3178c6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              position: 'relative',
              fontSize: '14px'
            }}
          >
            🔔 Notifications
            {hasNew && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '12px',
                height: '12px',
                backgroundColor: 'red',
                borderRadius: '50%',
                border: '2px solid white'
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937' }}>📈 Statistics Overview</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1' }}>{stats.totalSubmissions || 0}</div>
              <div style={{ fontSize: '14px', color: '#0369a1' }}>Total Submissions</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>{stats.pendingCount || 0}</div>
              <div style={{ fontSize: '14px', color: '#d97706' }}>Pending Review</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #22c55e' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{stats.acceptedCount || 0}</div>
              <div style={{ fontSize: '14px', color: '#16a34a' }}>Accepted</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #ef4444' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{stats.rejectedCount || 0}</div>
              <div style={{ fontSize: '14px', color: '#dc2626' }}>Rejected</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f3e8ff', borderRadius: '8px', border: '1px solid #a855f7' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9333ea' }}>{stats.totalMarks || 0}</div>
              <div style={{ fontSize: '14px', color: '#9333ea' }}>Total Marks Awarded</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px solid #0891b2' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0e7490' }}>{stats.totalUsers || 0}</div>
              <div style={{ fontSize: '14px', color: '#0e7490' }}>Active Students</div>
            </div>
          </div>
          {stats.categoryStats && Object.keys(stats.categoryStats).length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', color: '#374151' }}>📋 Submissions by Category</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(stats.categoryStats).map(([category, count]) => (
                  <div key={category} style={{
                    padding: '8px 12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}>
                    <strong>{category}:</strong> {count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters and Search */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1f2937' }}>🔍 Filter & Search</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Categories</option>
              <option value="activity">Activity</option>
              <option value="fullForm">Full Form</option>
              <option value="eventsForm">Events Form</option>
              <option value="individualEvents">Individual Events</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status">By Status</option>
              <option value="marks">By Marks</option>
            </select>
          </div>
        </div>
        {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setSortBy('newest');
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151'
              }}
            >
              🗑️ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Submissions */}
      {Object.keys(filteredSubmissions).length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: '#6b7280', margin: 0 }}>No submissions found</h3>
          <p style={{ color: '#9ca3af', marginTop: '8px' }}>Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div>
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Showing {Object.keys(filteredSubmissions).length} students with {Object.values(filteredSubmissions).reduce((total, userData) => total + userData.submissions.length, 0)} submissions
          </div>
          {Object.entries(filteredSubmissions).map(([email, userData]) => (
            <div
            key={email}
            id={userData.submissions.some((s) => s.status === 'pending') ? 'pending-section' : undefined}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
            <h3 style={{ 
              marginBottom: '20px', 
              color: '#2c3e50',
              borderBottom: '2px solid #3178c6',
              paddingBottom: '10px'
            }}>
              👤 {userData.userName} ({email})
            </h3>
            
            {/* Grid Layout for All Proofs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '18px',
              marginBottom: '20px'
            }}>
              {(() => {
                let globalIndex = 1; // Global counter for all proofs across all submissions
                
                return userData.submissions.map((submission) => {
                  const proofUrls = getProofUrls(submission);
                  
                  // Handle individual events differently
                  if (submission.category === 'individualEvents' && submission.events) {
                    return submission.events.map((event, eventIdx) => {
                      const currentIndex = globalIndex++;
                      const eventMarksKey = `${submission._id}-${event.key}`;
                      const eventNoteKey = `${submission._id}-${event.key}-note`;
                      
                      return (
                        <div key={`${submission._id}-${event.key}-${eventIdx}`} style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          padding: '16px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: `2px solid ${event.status === 'reviewed' ? '#10b981' : event.status === 'rejected' ? '#f44336' : '#f59e0b'}`,
                          position: 'relative',
                          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                        }}>
                          {/* Event Header */}
                          <div style={{
                            marginBottom: '12px',
                            padding: '8px 12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            borderLeft: '4px solid #667eea'
                          }}>
                            <h5 style={{ 
                              margin: '0 0 4px 0',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#2d3748'
                            }}>
                              🎯 {event.title}
                            </h5>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Status: <span style={{
                                fontWeight: 'bold',
                                color: event.status === 'reviewed' ? '#10b981' : event.status === 'rejected' ? '#f44336' : '#f59e0b'
                              }}>{event.status || 'pending'}</span>
                            </div>
                          </div>

                          {/* Event Data Display */}
                          {event.values && Object.keys(event.values).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <h6 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Student Data:</h6>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                                gap: '8px',
                                fontSize: '11px'
                              }}>
                                {Object.entries(event.values).map(([key, value]) => (
                                  <div key={key} style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '4px',
                                    border: '1px solid #e2e8f0'
                                  }}>
                                    <div style={{ fontWeight: 'bold', color: '#2d3748' }}>{key}:</div>
                                    <div style={{ color: '#4a5568' }}>{value || 0}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Proof Files */}
                          {event.proofUrls && event.proofUrls.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <h6 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Proof Files:</h6>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {event.proofUrls.map((proofUrl, proofIdx) => (
                                  <div 
                                    key={proofIdx}
                                    style={{
                                      width: '80px',
                                      height: '80px',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      border: '2px solid #e2e8f0'
                                    }}
                                    onClick={() => openImageModal(proofUrl)}
                                  >
                                    <img
                                      src={`http://localhost:8080${proofUrl}`}
                                      alt={`Proof ${proofIdx + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.style.backgroundColor = '#f5f5f5';
                                        e.target.parentElement.style.display = 'flex';
                                        e.target.parentElement.style.alignItems = 'center';
                                        e.target.parentElement.style.justifyContent = 'center';
                                        e.target.parentElement.innerHTML = '📄';
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mentor Marking Section */}
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <h6 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Mentor Evaluation:</h6>
                            
                            {event.status === 'reviewed' ? (
                              <div style={{ fontSize: '12px', color: '#374151' }}>
                                <div><strong>Marks Awarded:</strong> {event.mentorMarks ? Object.values(event.mentorMarks).reduce((sum, mark) => sum + (Number(mark) || 0), 0) : 0}</div>
                                {event.mentorNote && <div><strong>Note:</strong> {event.mentorNote}</div>}
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                                  {event.values && Object.keys(event.values).map(key => (
                                    <input
                                      key={key}
                                      type="number"
                                      placeholder={`${key} marks`}
                                      min="0"
                                      value={marksMap[`${eventMarksKey}-${key}`] || ''}
                                      onChange={(e) => setMarksMap(prev => ({ ...prev, [`${eventMarksKey}-${key}`]: e.target.value }))}
                                      style={{ 
                                        padding: '4px 6px', 
                                        borderRadius: '4px', 
                                        border: '1px solid #d1d5db', 
                                        fontSize: '11px',
                                        width: '100%'
                                      }}
                                    />
                                  ))}
                                </div>
                                <textarea
                                  placeholder="Evaluation note"
                                  rows="2"
                                  value={noteMap[eventNoteKey] || ''}
                                  onChange={(e) => setNoteMap(prev => ({ ...prev, [eventNoteKey]: e.target.value }))}
                                  style={{ 
                                    width: '100%',
                                    padding: '6px 8px', 
                                    borderRadius: '6px', 
                                    border: '1px solid #d1d5db', 
                                    fontSize: '11px', 
                                    resize: 'vertical',
                                    marginBottom: '8px'
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const eventMarks = {};
                                    const eventNote = document.getElementById(`note-${submission._id}-${eventIdx}`).value;
                                    
                                    // Collect marks from all input fields for this event
                                    Object.keys(event.counts || {}).forEach(countKey => {
                                      const markInput = document.getElementById(`mark-${submission._id}-${eventIdx}-${countKey}`);
                                      if (markInput && markInput.value) {
                                        eventMarks[countKey] = Number(markInput.value);
                                      }
                                    });
                                    
                                    handleEventMarking(submission._id, event.key, eventMarks, eventNote);
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    marginTop: '12px'
                                  }}
                                >
                                  Submit Marks
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  }

                  // Regular submission handling
                  return proofUrls.map((proofUrl) => {
                    const currentIndex = globalIndex++; // Use and increment global counter
                    const isDecided = submission.status !== 'pending';
                    
                    return (
                      <div key={`${submission._id}-${currentIndex}`} style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '14px',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                        border: `2px solid ${submission.status === 'accepted' ? '#4CAF50' : submission.status === 'rejected' ? '#f44336' : '#ff9800'}`,
                        position: 'relative',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                      }}
                      >
                        {/* Image */}
                        <div style={{
                          width: '100%',
                          height: '170px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          marginBottom: '14px',
                          position: 'relative',
                          cursor: 'pointer'
                        }} onClick={() => openImageModal(proofUrl)}>
                          <img
                            src={`http://localhost:8080${proofUrl}`}
                            alt={`Proof ${currentIndex}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div style={{
                            display: 'none',
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#f5f5f5',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontSize: '13px'
                          }}>
                            Image {currentIndex}
                          </div>
                          
                          {/* Image Number Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '7px',
                            right: '7px',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            padding: '5px 9px',
                            borderRadius: '15px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            #{currentIndex}
                          </div>
                        </div>

                        {/* Submission Info */}
                        <div style={{ marginBottom: '10px' }}>
                          <p style={{ 
                            fontSize: '13px', 
                            marginBottom: '7px',
                            fontWeight: 'bold',
                            color: '#2c3e50'
                          }}>
                            📚 {submission.activity}
                          </p>
                          <p style={{ fontSize: '12px', marginBottom: '7px' }}>
                            <strong>Status:</strong> 
                            <span style={{
                              fontWeight: 'bold',
                              color: submission.status === 'accepted' ? 'green' : submission.status === 'rejected' ? 'red' : '#ff9800',
                              textTransform: 'capitalize',
                              padding: '3px 7px',
                              borderRadius: '12px',
                              backgroundColor: submission.status === 'accepted' ? '#e8f5e8' : submission.status === 'rejected' ? '#ffeaea' : '#fff3e0',
                              marginLeft: '7px',
                              fontSize: '11px'
                            }}>
                              {submission.status}
                            </span>
                          </p>
                          {isDecided && (
                            <div style={{ fontSize: '12px', color: '#374151' }}>
                              <div><strong>Marks Awarded:</strong> {submission.marksAwarded || 0}</div>
                              {submission.decisionNote && <div><strong>Note:</strong> {submission.decisionNote}</div>}
                            </div>
                          )}
                        </div>

                        {/* Decision Inputs */}
                        {!isDecided && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginBottom: '8px' }}>
                            <input
                              type="number"
                              placeholder="Marks"
                              min="0"
                              value={marksMap[submission._id] || ''}
                              onChange={(e) => setMarksMap(prev => ({ ...prev, [submission._id]: e.target.value }))}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px' }}
                            />
                            <textarea
                              placeholder="Optional note"
                              rows="2"
                              value={noteMap[submission._id] || ''}
                              onChange={(e) => setNoteMap(prev => ({ ...prev, [submission._id]: e.target.value }))}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', resize: 'vertical' }}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '7px',
                          flexWrap: 'wrap'
                        }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(submission._id, 'accepted');
                            }}
                            disabled={submission.status === 'accepted'} 
                            style={{
                              padding: '6px 10px',
                              backgroundColor: submission.status === 'accepted' ? '#ccc' : '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: submission.status === 'accepted' ? 'not-allowed' : 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              flex: 1
                            }}
                          >
                            ✅ Accept
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(submission._id, 'rejected');
                            }}
                            disabled={submission.status === 'rejected'}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: submission.status === 'rejected' ? '#ccc' : '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: submission.status === 'rejected' ? 'not-allowed' : 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              flex: 1
                            }}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    );
                  });
                });
              })()}
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={closeImageModal}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }}>
            <img
              src={`http://localhost:8080${selectedImage}`}
              alt="Full size proof"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            <button
              onClick={closeImageModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
