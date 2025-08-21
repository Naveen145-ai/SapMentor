import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const StudentProofs = () => {
  const { email } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);

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

  const renderDetailsRows = (obj) => {
    try {
      const entries = Object.entries(obj || {});
      if (entries.length === 0) return <i>No details</i>;
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td style={{ border: '1px solid #eee', padding: '6px', width: '35%', fontWeight: 600 }}>{k}</td>
                <td style={{ border: '1px solid #eee', padding: '6px' }}>{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } catch (e) {
      return <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(obj, null, 2)}</pre>;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📁 Submissions for {email}</h2>
      {submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {submissions.map((s) => (
            <div key={s._id} style={{
              backgroundColor: '#ffffff',
              padding: '14px',
              borderRadius: '10px',
              border: `2px solid ${s.status === 'accepted' ? '#4CAF50' : s.status === 'rejected' ? '#f44336' : '#ff9800'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{s.activity}</div>
                <span style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  color: s.status === 'accepted' ? '#0d6632' : s.status === 'rejected' ? '#7a1313' : '#8a5a00',
                  backgroundColor: s.status === 'accepted' ? '#e6f7ec' : s.status === 'rejected' ? '#fde8e8' : '#fff4e6',
                  textTransform: 'capitalize'
                }}>{s.status}</span>
              </div>

              {s.category !== 'fullForm' ? (
                <div style={{ marginTop: '10px' }}>
                  {s.proofUrl && (
                    <a href={`http://localhost:8080${s.proofUrl}`} target="_blank" rel="noopener noreferrer">
                      📄 View Proof
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => setDetailsModal(s)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 View Full Details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {detailsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setDetailsModal(null)}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', width: 'min(900px, 95vw)', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Full SAP Form</h3>
              <button onClick={() => setDetailsModal(null)} style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
            <h4>Student Info</h4>
            {renderDetailsRows(detailsModal.details?.studentInfo)}
            <h4 style={{ marginTop: '14px' }}>Tables</h4>
            <pre style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', overflowX: 'auto' }}>{JSON.stringify(detailsModal.details?.tableData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProofs;
