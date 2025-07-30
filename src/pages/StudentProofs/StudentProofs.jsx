import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const StudentProofs = () => {
  const { email } = useParams();
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${email}`);
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
  }, [email]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📁 Submissions for {email}</h2>
      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        submissions.map((s) => (
          <div key={s._id} style={{
            backgroundColor: '#ffffff',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '8px',
            borderLeft: `6px solid ${s.status === 'accepted' ? '#4CAF50' : s.status === 'rejected' ? '#f44336' : '#ff9800'}`
          }}>
            <p><strong>Activity:</strong> {s.activity}</p>
            <p><strong>Status:</strong> {s.status}</p>
            <a href={`http://localhost:8080${s.proofUrl}`} target="_blank" rel="noopener noreferrer">
              📄 View Proof
            </a>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentProofs;
