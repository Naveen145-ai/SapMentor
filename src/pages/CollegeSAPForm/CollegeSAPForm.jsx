import React, { useState, useEffect } from 'react';

const CollegeSAPForm = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMarks, setStudentMarks] = useState({});
  const [mentorEmail] = useState('mugilanks.23cse@kongu.edu');

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const encodedEmail = encodeURIComponent(mentorEmail);
        const res = await fetch(`http://localhost:8080/api/mentor/submissions/${encodedEmail}`);
        const data = await res.json();
        
        if (res.ok) {
          const grouped = {};
          data.forEach(sub => {
            if (!grouped[sub.email]) {
              grouped[sub.email] = {
                email: sub.email,
                name: sub.userName || sub.name || 'Unknown User',
                rollNumber: sub.rollNumber || '',
                year: sub.year || '',
                section: sub.section || '',
                semester: sub.semester || '',
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
  const handleMarksChange = (activityType, category, field, value) => {
    const key = `${selectedStudent.email}_${activityType}_${category}`;
    setStudentMarks(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: parseInt(value) || 0
      }
    }));
  };

  // Calculate total for a category
  const calculateCategoryTotal = (activityType, category) => {
    const key = `${selectedStudent.email}_${activityType}_${category}`;
    const marks = studentMarks[key] || {};
    return (marks.count || 0) * (marks.marks || 0);
  };

  // Calculate activity total
  const calculateActivityTotal = (activityType) => {
    let total = 0;
    const categories = getActivityCategories(activityType);
    categories.forEach(cat => {
      total += calculateCategoryTotal(activityType, cat.key);
    });
    return total;
  };

  // Get categories for each activity type
  const getActivityCategories = (activityType) => {
    const categories = {
      paperPresentation: [
        { key: 'presented_inside', label: 'Inside', maxMarks: 5 },
        { key: 'presented_outside', label: 'Outside', maxMarks: 10 },
        { key: 'presented_premier', label: 'Premier', maxMarks: 20 },
        { key: 'prize_inside', label: 'Inside', maxMarks: 20 },
        { key: 'prize_outside', label: 'Outside', maxMarks: 30 },
        { key: 'prize_premier', label: 'Premier', maxMarks: 50 }
      ],
      projectPresentation: [
        { key: 'presented_inside', label: 'Inside', maxMarks: 10 },
        { key: 'presented_outside', label: 'Outside', maxMarks: 15 },
        { key: 'presented_premier', label: 'Premier', maxMarks: 20 },
        { key: 'prize_inside', label: 'Inside', maxMarks: 20 },
        { key: 'prize_outside', label: 'Outside', maxMarks: 30 },
        { key: 'prize_premier', label: 'Premier', maxMarks: 50 }
      ],
      technoManagerial: [
        { key: 'participated_inside', label: 'Inside', maxMarks: 2 },
        { key: 'participated_outside', label: 'Outside', maxMarks: 5 },
        { key: 'participated_state', label: 'State', maxMarks: 10 },
        { key: 'participated_national', label: 'National/International', maxMarks: 20 },
        { key: 'prize_inside', label: 'Inside', maxMarks: 10 },
        { key: 'prize_outside', label: 'Outside', maxMarks: 20 },
        { key: 'prize_state', label: 'State', maxMarks: 30 },
        { key: 'prize_national', label: 'National/International', maxMarks: 50 }
      ],
      sportsGames: [
        { key: 'participated_inside', label: 'Inside', maxMarks: 2 },
        { key: 'participated_zone', label: 'Zone/Outside', maxMarks: 10 },
        { key: 'participated_state', label: 'State/Inter Zone', maxMarks: 20 },
        { key: 'participated_national', label: 'National/International', maxMarks: 50 },
        { key: 'prize_inside', label: 'Inside', maxMarks: 5 },
        { key: 'prize_zone', label: 'Zone/Outside', maxMarks: 20 },
        { key: 'prize_state', label: 'State/Inter Zone', maxMarks: 40 },
        { key: 'prize_national', label: 'National/International', maxMarks: 100 }
      ]
    };
    return categories[activityType] || [];
  };

  // Save marks
  const saveStudentMarks = async () => {
    if (!selectedStudent) return;

    try {
      const totalMarks = calculateActivityTotal('paperPresentation') + 
                        calculateActivityTotal('projectPresentation') + 
                        calculateActivityTotal('technoManagerial') + 
                        calculateActivityTotal('sportsGames');

      const marksData = {
        studentEmail: selectedStudent.email,
        studentName: selectedStudent.name,
        mentorEmail: mentorEmail,
        marks: studentMarks,
        totalMarks: totalMarks,
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

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    border: '2px solid #000',
    fontSize: '12px',
    fontFamily: 'Arial, sans-serif'
  };

  const cellStyle = {
    border: '1px solid #000',
    padding: '4px',
    textAlign: 'center',
    backgroundColor: '#fff'
  };

  const headerStyle = {
    ...cellStyle,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  };

  const inputStyle = {
    width: '40px',
    textAlign: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '11px'
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>
          KONGU ENGINEERING COLLEGE, PERUNDURAI, ERODE — 638060
        </h2>
        <h3 style={{ margin: '5px 0', fontSize: '14px' }}>
          DEPARTMENT OF COMPUTER SCIENCE ENGINEERING
        </h3>
        <h4 style={{ margin: '5px 0', fontSize: '12px' }}>
          STUDENT ACTIVITY POINTS INDEX
        </h4>
      </div>

      {/* Student Selection */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={selectedStudent?.email || ''}
          onChange={(e) => {
            const student = students.find(s => s.email === e.target.value);
            setSelectedStudent(student);
          }}
          style={{
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #000',
            marginBottom: '10px'
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

      {selectedStudent && (
        <>
          {/* Student Info Table */}
          <table style={{ ...tableStyle, marginBottom: '20px', width: '50%' }}>
            <tbody>
              <tr>
                <td style={headerStyle}>Student Name</td>
                <td style={cellStyle}>:</td>
                <td style={cellStyle}>{selectedStudent.name}</td>
              </tr>
              <tr>
                <td style={headerStyle}>Roll Number</td>
                <td style={cellStyle}>:</td>
                <td style={cellStyle}>{selectedStudent.rollNumber}</td>
              </tr>
              <tr>
                <td style={headerStyle}>Year</td>
                <td style={cellStyle}>:</td>
                <td style={cellStyle}>{selectedStudent.year}</td>
              </tr>
              <tr>
                <td style={headerStyle}>Section</td>
                <td style={cellStyle}>:</td>
                <td style={cellStyle}>{selectedStudent.section}</td>
              </tr>
              <tr>
                <td style={headerStyle}>Semester</td>
                <td style={cellStyle}>:</td>
                <td style={cellStyle}>{selectedStudent.semester}</td>
              </tr>
              <tr>
                <td style={headerStyle}>Mentor Name</td>
                <td style={cellStyle}>:</td>
                <td style={cellStyle}>{mentorEmail}</td>
              </tr>
            </tbody>
          </table>

          {/* Paper Presentation */}
          <table style={tableStyle}>
            <thead>
              <tr>
                <td rowSpan="3" style={headerStyle}>Activity</td>
                <td style={headerStyle}>Submitted</td>
                <td colSpan="3" style={headerStyle}>Presented</td>
                <td colSpan="3" style={headerStyle}>Prize</td>
                <td style={headerStyle}>Max Points</td>
              </tr>
              <tr>
                <td style={headerStyle}></td>
                <td style={headerStyle}>Inside</td>
                <td style={headerStyle}>Outside</td>
                <td style={headerStyle}>Premier</td>
                <td style={headerStyle}>Inside</td>
                <td style={headerStyle}>Outside</td>
                <td style={headerStyle}>Premier</td>
                <td style={headerStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}></td>
                <td style={headerStyle}>5</td>
                <td style={headerStyle}>10</td>
                <td style={headerStyle}>20</td>
                <td style={headerStyle}>20</td>
                <td style={headerStyle}>30</td>
                <td style={headerStyle}>50</td>
                <td style={headerStyle}>75</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan="3" style={headerStyle}>1.Paper Presentation</td>
                <td style={cellStyle}>2</td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('paperPresentation', 'presented_inside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('paperPresentation', 'presented_outside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('paperPresentation', 'presented_premier', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('paperPresentation', 'prize_inside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('paperPresentation', 'prize_outside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('paperPresentation', 'prize_premier', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>{calculateActivityTotal('paperPresentation')}</td>
              </tr>
              <tr>
                <td style={headerStyle}>Count</td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_paperPresentation_presented_inside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_paperPresentation_presented_outside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_paperPresentation_presented_premier`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_paperPresentation_prize_inside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_paperPresentation_prize_outside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_paperPresentation_prize_premier`]?.count || 0}
                </td>
                <td style={cellStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}>Student marks (count x marks)</td>
                <td style={cellStyle}>{calculateCategoryTotal('paperPresentation', 'presented_inside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('paperPresentation', 'presented_outside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('paperPresentation', 'presented_premier')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('paperPresentation', 'prize_inside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('paperPresentation', 'prize_outside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('paperPresentation', 'prize_premier')}</td>
                <td style={cellStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}>Mentor marks (count x marks)</td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}>Proof page number</td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
              </tr>
            </tbody>
          </table>

          <div style={{ height: '20px' }}></div>

          {/* Project Presentation */}
          <table style={tableStyle}>
            <thead>
              <tr>
                <td rowSpan="3" style={headerStyle}>Activity</td>
                <td style={headerStyle}>Submitted</td>
                <td colSpan="3" style={headerStyle}>Presented</td>
                <td colSpan="3" style={headerStyle}>Prize</td>
                <td style={headerStyle}>Max Points</td>
              </tr>
              <tr>
                <td style={headerStyle}></td>
                <td style={headerStyle}>Inside</td>
                <td style={headerStyle}>Outside</td>
                <td style={headerStyle}>Premier</td>
                <td style={headerStyle}>Inside</td>
                <td style={headerStyle}>Outside</td>
                <td style={headerStyle}>Premier</td>
                <td style={headerStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}></td>
                <td style={headerStyle}>10</td>
                <td style={headerStyle}>15</td>
                <td style={headerStyle}>20</td>
                <td style={headerStyle}>20</td>
                <td style={headerStyle}>30</td>
                <td style={headerStyle}>50</td>
                <td style={headerStyle}>100</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan="3" style={headerStyle}>2.Project Presentation</td>
                <td style={cellStyle}>5</td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('projectPresentation', 'presented_inside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('projectPresentation', 'presented_outside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('projectPresentation', 'presented_premier', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('projectPresentation', 'prize_inside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('projectPresentation', 'prize_outside', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>
                  <input 
                    type="number" 
                    style={inputStyle}
                    onChange={(e) => handleMarksChange('projectPresentation', 'prize_premier', 'count', e.target.value)}
                  />
                </td>
                <td style={cellStyle}>{calculateActivityTotal('projectPresentation')}</td>
              </tr>
              <tr>
                <td style={headerStyle}>Count</td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_projectPresentation_presented_inside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_projectPresentation_presented_outside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_projectPresentation_presented_premier`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_projectPresentation_prize_inside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_projectPresentation_prize_outside`]?.count || 0}
                </td>
                <td style={cellStyle}>
                  {studentMarks[`${selectedStudent.email}_projectPresentation_prize_premier`]?.count || 0}
                </td>
                <td style={cellStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}>Student marks (count x marks)</td>
                <td style={cellStyle}>{calculateCategoryTotal('projectPresentation', 'presented_inside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('projectPresentation', 'presented_outside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('projectPresentation', 'presented_premier')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('projectPresentation', 'prize_inside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('projectPresentation', 'prize_outside')}</td>
                <td style={cellStyle}>{calculateCategoryTotal('projectPresentation', 'prize_premier')}</td>
                <td style={cellStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}>Mentor marks (count x marks)</td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
              </tr>
              <tr>
                <td style={headerStyle}>Proof page number</td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
                <td style={cellStyle}></td>
              </tr>
            </tbody>
          </table>

          <div style={{ height: '20px' }}></div>

          {/* Save Button */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              onClick={saveStudentMarks}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Save SAP Marks
            </button>
          </div>

          {/* Signature Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '40px',
            fontSize: '12px'
          }}>
            <div>
              <div style={{ marginBottom: '40px' }}>
                <strong>Signature with date</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: '40px' }}>
                <strong>Mentor Signature</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CollegeSAPForm;
