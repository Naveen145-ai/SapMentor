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
    <div style={styles.container}>
      <h2 style={styles.heading}>🔔 Notifications</h2>
      {hasNewSubmissions ? (
        <p style={styles.newNotification}>You have new submissions to review!</p>
      ) : (
        <p style={styles.noNotification}>No new notifications.</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #f3f4f6, #e0f2fe, #dbeafe)',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    margin: '40px auto',
    textAlign: 'center'
  },
  heading: {
    fontSize: '1.6rem',
    color: '#1e40af',
    marginBottom: '15px',
    fontWeight: '600'
  },
  newNotification: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    backgroundColor: '#fee2e2',
    padding: '10px',
    borderRadius: '6px'
  },
  noNotification: {
    color: '#4b5563',
    fontSize: '1rem',
    backgroundColor: '#f3f4f6',
    padding: '10px',
    borderRadius: '6px'
  }
};

export default Notification;
