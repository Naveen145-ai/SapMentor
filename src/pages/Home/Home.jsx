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

  return (
    <div className="start">
      <h1 className="text-3xl font-bold text-center mb-6">📋 Mentor Dashboard</h1>

      {submissions.length === 0 ? (
        <p className="text-center text-gray-500">No submissions found.</p>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <div
              key={submission._id}
              className="border rounded-xl p-4 shadow-md bg-white"
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === submission._id ? null : submission._id)
                }
              >
                <div>
                  <p className="font-semibold">{submission.name}</p>
                  <p className="text-sm text-gray-500">{submission.email}</p>
                </div>
                <span className="text-blue-600 ">
                  {expandedId === submission._id ? '▲ Hide' : '▼ View'}
                </span>
              </div>

              {expandedId === submission._id && (
                <div className="mt-4 space-y-2">
                  <p><strong>Activity:</strong> {submission.activity}</p>
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
                  <p><strong>Status:</strong> <span className="capitalize">{submission.status}</span></p>
                  <p><strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}</p>

                  {submission.status === 'pending' && (
                    <div className="mt-4 space-x-4">
                      <button
                        onClick={() => handleDecision(submission._id, 'accepted')}
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecision(submission._id, 'rejected')}
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
      )}
    </div>
  );
};

export default Home;
