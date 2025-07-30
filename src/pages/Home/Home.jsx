import React, { useEffect, useState } from 'react';

const Home = () => {
  const [groupedSubmissions, setGroupedSubmissions] = useState({});
  const [hasNew, setHasNew] = useState(false); // notification state
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
            if (!grouped[sub.email]) grouped[sub.email] = [];
            grouped[sub.email].push(sub);
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
      const res = await fetch(`http://localhost:8080/api/mentor/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (res.ok) {
        setGroupedSubmissions(prev => {
          const updated = { ...prev };
          for (let email in updated) {
            updated[email] = updated[email].map(s => 
              s._id === id ? { ...s, status: newStatus } : s
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
        Object.entries(groupedSubmissions).map(([email, submissions]) => (
          <div
            key={email}
            id={submissions.some((s) => s.status === 'pending') ? 'pending-section' : undefined}
            style={{
              border: '1px solid #ccc',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '30px',
              backgroundColor: '#f4f7fb'
            }}>
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>{email}</h3>
            {submissions.map((s) => (
              <div key={s._id} style={{
                backgroundColor: '#ffffff',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                borderLeft: `6px solid ${s.status === 'accepted' ? '#4CAF50' : s.status === 'rejected' ? '#f44336' : '#ff9800'}`
              }}>
                <p><strong>Activity:</strong> {s.activity}</p>
                <p><strong>Status:</strong> <span style={{
                  fontWeight: 'bold',
                  color: s.status === 'accepted' ? 'green' : s.status === 'rejected' ? 'red' : '#ff9800',
                  textTransform: 'capitalize'
                }}>{s.status}</span></p>
                <a href={`http://localhost:8080${s.proofUrl}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#3178c6' }}>
                  📄 View Proof
                </a>
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => handleStatusChange(s._id, 'accepted')} disabled={s.status === 'accepted'} style={{ marginRight: '10px' }}>
                    ✅ Accept
                  </button>
                  <button onClick={() => handleStatusChange(s._id, 'rejected')} disabled={s.status === 'rejected'}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default Home;
