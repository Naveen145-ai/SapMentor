import React, { useState, useEffect } from 'react';
import './Home.css';

const dummySubmissions = [
  {
    _id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    activity: 'Hackathon Participation',
    proofUrl: '/uploads/hackathon.png',
    status: 'pending',
    submittedAt: '2025-07-21T10:15:00Z',
  },
  {
    _id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    activity: 'Workshop Attended',
    proofUrl: '/uploads/workshop.pdf',
    status: 'pending',
    submittedAt: '2025-07-20T14:30:00Z',
  },
  {
    _id: '3',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    activity: 'Seminar Presentation',
    proofUrl: '/uploads/seminar.pdf',
    status: 'pending',
    submittedAt: '2025-07-22T09:00:00Z',
  },
];

const Home = () => {
  const [submissions, setSubmissions] = useState([]);
  const [expandedId, setExpandedId] = useState(null); // track which item is expanded

  useEffect(() => {
    setSubmissions(dummySubmissions);
  }, []);

  const handleDecision = (id, decision) => {
    const updated = submissions.map((item) =>
      item._id === id ? { ...item, status: decision } : item
    );
    setSubmissions(updated);
    alert(`✅ Submission ${decision.toUpperCase()} for ID: ${id}`);
    setExpandedId(null); // close after action
  };

  // Group submissions by email
  const grouped = submissions.reduce((acc, curr) => {
    acc[curr.email] = acc[curr.email] || [];
    acc[curr.email].push(curr);
    return acc;
  }, {});

  return (
    <div className="start">
      <h1 className="text-3xl font-bold text-center mb-6">📋 Mentor Dashboard</h1>

      {submissions.length === 0 ? (
        <p className="text-center text-gray-500">No submissions found.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([email, userSubmissions]) => (
       <div
  key={email}
  className="p-4 mb-6 bg-white"
  style={{
    border: '1px solid black',
    borderRadius: '12px',
  }}
>

              <p className="font-semibold text-lg">{userSubmissions[0].name}</p>
              <p className="text-sm text-gray-500 mb-4">{email}</p>

              {userSubmissions.map((submission) => (
                <div
                  key={submission._id}
                  className="border rounded p-3 mb-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{submission.activity}</p>
                    <span
                      className="text-blue-600 cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === submission._id ? null : submission._id
                        )
                      }
                    >
                      {expandedId === submission._id ? '▲ Hide' : '▼ View'}
                    </span>
                  </div>

                  {expandedId === submission._id && (
                    <div className="mt-2 space-y-1 text-sm">
                      <p>
                        <strong>Proof:</strong>{' '}
                        <a
                          href={submission.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View File
                        </a>
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className="capitalize">{submission.status}</span>
                      </p>
                      <p>
                        <strong>Submitted:</strong>{' '}
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>

                      {submission.status === 'pending' && (
                        <div className="mt-2 space-x-4">
                          <button
                            onClick={() =>
                              handleDecision(submission._id, 'accepted')
                            }
                            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleDecision(submission._id, 'rejected')
                            }
                            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
