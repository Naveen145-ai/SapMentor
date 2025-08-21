import React, { useEffect, useState } from 'react';

const Home = () => {
  const [groupedSubmissions, setGroupedSubmissions] = useState({});
  const [hasNew, setHasNew] = useState(false); // notification state
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [marksMap, setMarksMap] = useState({});
  const [noteMap, setNoteMap] = useState({});
  const mentorEmail = localStorage.getItem('mentorEmail');

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
    
    // Check for other proof-related fields
    Object.keys(submission).forEach(key => {
      if (key.includes('proof') && key.includes('Url') && submission[key] && !urls.includes(submission[key])) {
        urls.push(submission[key]);
      }
    });
    
    return urls;
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Notification Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2>👨‍🏫 Mentor Dashboard</h2>
        <div style={{ position: 'relative' }}>
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

      {/* Submissions */}
      {Object.keys(groupedSubmissions).length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        Object.entries(groupedSubmissions).map(([email, userData]) => (
          <div
            key={email}
            id={userData.submissions.some((s) => s.status === 'pending') ? 'pending-section' : undefined}
            style={{
              border: '1px solid #ccc',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '30px',
              backgroundColor: '#f4f7fb'
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
        ))
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
