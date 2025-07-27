import React, { useEffect, useState } from 'react';

const Home = () => {
  const [submissions, setSubmissions] = useState([]);
  const mentorEmail = localStorage.getItem('mentorEmail'); // must be set on login

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

  return (
    <div>
      <h2>Mentor Dashboard</h2>
      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <ul>
          {submissions.map((s) => (
            <li key={s._id}>
              <p><strong>{s.name}</strong> submitted: {s.activity}</p>
              <p>Status: {s.status}</p>
              <a href={`http://localhost:8080${s.proofUrl}`} target="_blank" rel="noopener noreferrer">View Proof</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Home;
