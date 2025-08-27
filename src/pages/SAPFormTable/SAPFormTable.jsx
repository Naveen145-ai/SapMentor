import React, { useState, useEffect } from 'react';

const SAPFormTable = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMarks, setStudentMarks] = useState({});
  const [mentorEmail] = useState('mugilanks.23cse@kongu.edu');

  // SAP Form structure based on your college format
  const sapStructure = [
    {
      id: 'paperPresentation',
      title: '1. Paper Presentation',
      categories: [
        { key: 'presented_inside', label: 'Inside', maxMarks: 5 },
        { key: 'presented_outside', label: 'Outside', maxMarks: 10 },
        { key: 'presented_premier', label: 'Premier', maxMarks: 20 },
        { key: 'prize_inside', label: 'Prize Inside', maxMarks: 20 },
        { key: 'prize_outside', label: 'Prize Outside', maxMarks: 30 },
        { key: 'prize_premier', label: 'Prize Premier', maxMarks: 50 }
      ],
      maxPoints: 75
    },
    {
      id: 'projectPresentation',
      title: '2. Project Presentation',
      categories: [
        { key: 'presented_inside', label: 'Inside', maxMarks: 10 },
        { key: 'presented_outside', label: 'Outside', maxMarks: 15 },
        { key: 'presented_premier', label: 'Premier', maxMarks: 20 },
        { key: 'prize_inside', label: 'Prize Inside', maxMarks: 20 },
        { key: 'prize_outside', label: 'Prize Outside', maxMarks: 30 },
        { key: 'prize_premier', label: 'Prize Premier', maxMarks: 50 }
      ],
      maxPoints: 100
    },
    {
      id: 'technoManagerial',
      title: '3. Techno Managerial Events',
      categories: [
        { key: 'participated_inside', label: 'Inside', maxMarks: 2 },
        { key: 'participated_outside', label: 'Outside', maxMarks: 5 },
        { key: 'participated_state', label: 'State', maxMarks: 10 },
        { key: 'participated_national', label: 'National/International', maxMarks: 20 },
        { key: 'prize_inside', label: 'Prize Inside', maxMarks: 10 },
        { key: 'prize_outside', label: 'Prize Outside', maxMarks: 20 },
        { key: 'prize_state', label: 'Prize State', maxMarks: 30 },
        { key: 'prize_national', label: 'Prize National/International', maxMarks: 50 }
      ],
      maxPoints: 75
    },
    {
      id: 'sportsGames',
      title: '4. Sports & Games',
      categories: [
        { key: 'participated_inside', label: 'Inside', maxMarks: 2 },
        { key: 'participated_zone', label: 'Zone/Outside', maxMarks: 10 },
        { key: 'participated_state', label: 'State/Inter Zone', maxMarks: 20 },
        { key: 'participated_national', label: 'National/International', maxMarks: 50 },
        { key: 'prize_inside', label: 'Prize Inside', maxMarks: 5 },
        { key: 'prize_zone', label: 'Prize Zone/Outside', maxMarks: 20 },
        { key: 'prize_state', label: 'Prize State/Inter Zone', maxMarks: 40 },
        { key: 'prize_national', label: 'Prize National/International', maxMarks: 100 }
      ],
      maxPoints: 100
    }
  ];

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const encodedEmail = encodeURIComponent(mentorEmail);
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${encodedEmail}`);
        const data = await res.json();
        
        if (res.ok) {
          // Group by student
          const grouped = {};
          data.forEach(sub => {
            if (!grouped[sub.email]) {
              grouped[sub.email] = {
                email: sub.email,
                name: sub.userName || sub.name || 'Unknown User',
                submissions: []
              };
            }
            grouped[sub.email].submissions.push(sub);
          });
          setStudents(Object.values(grouped));
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [mentorEmail]);

  // Handle marks change
  const handleMarksChange = (activityId, categoryKey, value, count = 1) => {
    const key = `${selectedStudent.email}_${activityId}_${categoryKey}`;
    setStudentMarks(prev => ({
      ...prev,
      [key]: {
        marks: parseInt(value) || 0,
        count: parseInt(count) || 0,
        total: (parseInt(value) || 0) * (parseInt(count) || 0)
      }
    }));
  };

  // Calculate total marks for a student
  const calculateTotalMarks = (studentEmail) => {
    let total = 0;
    Object.keys(studentMarks).forEach(key => {
      if (key.startsWith(studentEmail)) {
        total += studentMarks[key].total || 0;
      }
    });
    return total;
  };

  // Save marks for student
  const saveStudentMarks = async () => {
    if (!selectedStudent) return;

    try {
      const marksData = {
        studentEmail: selectedStudent.email,
        studentName: selectedStudent.name,
        mentorEmail: mentorEmail,
        marks: studentMarks,
        totalMarks: calculateTotalMarks(selectedStudent.email),
        updatedAt: new Date().toISOString()
      };

      const res = await fetch('http://localhost:8080/api/mentor/save-sap-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marksData)
      });

      if (res.ok) {
        alert('Marks saved successfully!');
      } else {
        alert('Failed to save marks');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Error saving marks');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      color: '#000000'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
        border: '1px solid #333333',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#ffffff', fontSize: '24px', fontWeight: '700' }}>
          KONGU ENGINEERING COLLEGE, PERUNDURAI, ERODE — 638060
        </h1>
        <h2 style={{ margin: '10px 0', color: '#cccccc', fontSize: '18px' }}>
          DEPARTMENT OF COMPUTER SCIENCE ENGINEERING
        </h2>
        <h3 style={{ margin: '10px 0', color: '#ffffff', fontSize: '16px' }}>
          STUDENT ACTIVITY POINTS INDEX - MENTOR EVALUATION
        </h3>
      </div>

      {/* Student Selection */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
        border: '1px solid #333333'
      }}>
        <h3 style={{ marginTop: 0, color: '#ffffff' }}>Select Student</h3>
        <select
          value={selectedStudent?.email || ''}
          onChange={(e) => {
            const student = students.find(s => s.email === e.target.value);
            setSelectedStudent(student);
          }}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            border: '1px solid #444444',
            borderRadius: '8px',
            fontSize: '16px'
          }}
        >
          <option value="">Select a student...</option>
          {students.map(student => (
            <option key={student.email} value={student.email}>
              {student.name} ({student.email})
            </option>
          ))}
        </select>
      </div>

      {/* SAP Form Table */}
      {selectedStudent && (
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
          border: '1px solid #333333'
        }}>
          {/* Student Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '30px',
            padding: '16px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px'
          }}>
            <div>
              <strong>Student Name:</strong> {selectedStudent.name}
            </div>
            <div>
              <strong>Email:</strong> {selectedStudent.email}
            </div>
            <div>
              <strong>Total Submissions:</strong> {selectedStudent.submissions.length}
            </div>
            <div>
              <strong>Total SAP Marks:</strong> {calculateTotalMarks(selectedStudent.email)}
            </div>
          </div>

          {/* SAP Activities Table */}
          {sapStructure.map(activity => (
            <div key={activity.id} style={{ marginBottom: '40px' }}>
              <h3 style={{ 
                color: '#ffffff', 
                marginBottom: '20px',
                fontSize: '18px',
                borderBottom: '2px solid #3178c6',
                paddingBottom: '8px'
              }}>
                {activity.title} (Max Points: {activity.maxPoints})
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#333333' }}>
                      <th style={{ padding: '12px', border: '1px solid #444444', color: '#ffffff' }}>Activity</th>
                      <th style={{ padding: '12px', border: '1px solid #444444', color: '#ffffff' }}>Count</th>
                      <th style={{ padding: '12px', border: '1px solid #444444', color: '#ffffff' }}>Marks per Item</th>
                      <th style={{ padding: '12px', border: '1px solid #444444', color: '#ffffff' }}>Max Marks</th>
                      <th style={{ padding: '12px', border: '1px solid #444444', color: '#ffffff' }}>Total Marks</th>
                      <th style={{ padding: '12px', border: '1px solid #444444', color: '#ffffff' }}>Proof Page Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.categories.map(category => {
                      const key = `${selectedStudent.email}_${activity.id}_${category.key}`;
                      const currentMarks = studentMarks[key] || { marks: 0, count: 0, total: 0 };
                      
                      return (
                        <tr key={category.key}>
                          <td style={{ padding: '12px', border: '1px solid #444444', color: '#ffffff' }}>
                            {category.label}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #444444' }}>
                            <input
                              type="number"
                              min="0"
                              value={currentMarks.count}
                              onChange={(e) => handleMarksChange(activity.id, category.key, currentMarks.marks, e.target.value)}
                              style={{
                                width: '60px',
                                padding: '6px',
                                backgroundColor: '#1a1a1a',
                                color: '#ffffff',
                                border: '1px solid #555555',
                                borderRadius: '4px',
                                textAlign: 'center'
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #444444' }}>
                            <input
                              type="number"
                              min="0"
                              max={category.maxMarks}
                              value={currentMarks.marks}
                              onChange={(e) => handleMarksChange(activity.id, category.key, e.target.value, currentMarks.count)}
                              style={{
                                width: '60px',
                                padding: '6px',
                                backgroundColor: '#1a1a1a',
                                color: '#ffffff',
                                border: '1px solid #555555',
                                borderRadius: '4px',
                                textAlign: 'center'
                              }}
                            />
                          </td>
                          <td style={{ 
                            padding: '12px', 
                            border: '1px solid #444444', 
                            color: '#ffffff',
                            textAlign: 'center',
                            fontWeight: 'bold'
                          }}>
                            {category.maxMarks}
                          </td>
                          <td style={{ 
                            padding: '12px', 
                            border: '1px solid #444444', 
                            color: '#10b981',
                            textAlign: 'center',
                            fontWeight: 'bold'
                          }}>
                            {currentMarks.total}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #444444' }}>
                            <input
                              type="text"
                              placeholder="Page #"
                              style={{
                                width: '80px',
                                padding: '6px',
                                backgroundColor: '#1a1a1a',
                                color: '#ffffff',
                                border: '1px solid #555555',
                                borderRadius: '4px',
                                textAlign: 'center'
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Save Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              onClick={saveStudentMarks}
              style={{
                padding: '12px 30px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              💾 Save SAP Marks
            </button>
          </div>

          {/* Mentor Signature Section */}
          <div style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>Total SAP Marks: {calculateTotalMarks(selectedStudent.email)}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Mentor Signature</strong>
              </div>
              <div style={{ 
                width: '200px', 
                height: '40px', 
                border: '1px solid #444444',
                backgroundColor: '#1a1a1a'
              }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SAPFormTable;
