// mentor/pages/Notification.jsx
import React, { useEffect, useState } from 'react';

const Notification = () => {
  const [hasNewSubmissions, setHasNewSubmissions] = useState(false);
  const mentorEmail = localStorage.getItem('mentorEmail');

  useEffect(() => {
    if (!mentorEmail) return;

    const checkNewSubmissions = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${mentorEmail}`);
        const data = await res.json();

        if (res.ok) {
          const pendingExists = data.some((s) => s.status === 'pending');
          setHasNewSubmissions(pendingExists);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkNewSubmissions();
  }, [mentorEmail]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔔 Notifications</h2>
      {hasNewSubmissions ? (
        <p style={{ color: 'red', fontWeight: 'bold' }}>You have new submissions to review!</p>
      ) : (
        <p>No new notifications.</p>
      )}
    </div>
  );
};

export default Notification;
