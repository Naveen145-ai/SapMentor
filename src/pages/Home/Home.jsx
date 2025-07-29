import React, { useEffect, useState } from 'react';

const Home = () => {
  const [submissions, setSubmissions] = useState([]);
  const mentorEmail = localStorage.getItem('mentorEmail');

  useEffect(() => {
    if (!mentorEmail) return;

    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${mentorEmail}`);
        const data = await res.json();

        if (res.ok) {
          setSubmissions(data);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json();
      if (res.ok) {
        // Update the state with new status
        setSubmissions((prev) =>
          prev.map((s) => (s._id === id ? { ...s, status: newStatus } : s))
        );
      } else {
        alert(result.message || 'Failed to update');
      }
    } catch (error) {
      console.error(error);
      alert('Update failed');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Mentor Dashboard</h2>
      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <ul>
          {submissions.map((s) => (
            <li key={s._id} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <p><strong>{s.name}</strong> submitted: {s.activity}</p>
              <p>Status: <strong>{s.status}</strong></p>
              <a href={`http://localhost:8080${s.proofUrl}`} target="_blank" rel="noopener noreferrer">View Proof</a>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleStatusChange(s._id, 'accepted')} disabled={s.status === 'accepted'}>
                  ✅ Accept
                </button>
                <button onClick={() => handleStatusChange(s._id, 'rejected')} disabled={s.status === 'rejected'} style={{ marginLeft: '10px' }}>
                  ❌ Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;
