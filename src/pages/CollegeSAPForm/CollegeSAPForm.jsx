import React, { useState, useEffect } from 'react';

// Top-level pure helpers so they are always in scope
const getEventConfig = (key) => {
  const k = (key || '').toLowerCase();
  if (k.includes('paper')) {
    return {
      title: '1. Paper Presentation',
      columns: [
        { key: 'insidePresented', label: 'Inside', points: 5 },
        { key: 'outsidePresented', label: 'Outside', points: 10 },
        { key: 'premierPresented', label: 'Premier', points: 20 },
        { key: 'insidePrize', label: 'Inside', points: 20 },
        { key: 'outsidePrize', label: 'Outside', points: 30 },
        { key: 'premierPrize', label: 'Premier', points: 50 },
      ],
      maxPoints: 75,
      headerGroups: [
        { title: 'Presented', span: 3 },
        { title: 'Prize', span: 3 },
      ],
    };
  }
  if (k.includes('project')) {
    return {
      title: '2. Project Presentation',
      columns: [
        { key: 'insidePresented', label: 'Inside', points: 10 },
        { key: 'outsidePresented', label: 'Outside', points: 15 },
        { key: 'premierPresented', label: 'Premier', points: 20 },
        { key: 'insidePrize', label: 'Inside', points: 20 },
        { key: 'outsidePrize', label: 'Outside', points: 30 },
        { key: 'premierPrize', label: 'Premier', points: 50 },
      ],
      maxPoints: 100,
      headerGroups: [
        { title: 'Presented', span: 3 },
        { title: 'Prize', span: 3 },
      ],
    };
  }
  return null;
};

const renderStructuredEventTable = (ev, tableStyle, headerStyle, cellStyle, inputStyle) => {
  const cfg = getEventConfig(ev.key || ev.title || '');
  if (!cfg) return null;
  const counts = ev.values?.counts || {};
  const student = ev.values?.studentMarks || {};
  return (
    <table style={{ ...tableStyle, marginTop: '20px' }} key={ev.key}>
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
          {cfg.columns.slice(0,3).map(c => (
            <td key={`pp-${c.key}`} style={headerStyle}>{c.points}</td>
          ))}
          {cfg.columns.slice(3).map(c => (
            <td key={`pz-${c.key}`} style={headerStyle}>{c.points}</td>
          ))}
          <td style={headerStyle}>{cfg.maxPoints}</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowSpan="3" style={headerStyle}>{cfg.title}</td>
          <td style={{...cellStyle, backgroundColor: '#e3f2fd', fontWeight: 'bold'}}>
            {cfg.columns.reduce((s, c) => s + (parseInt(counts[c.key] || 0) || 0), 0)}
          </td>
          {cfg.columns.map(c => (
            <td key={`cnt-${c.key}`} style={cellStyle}>{counts[c.key] || 0}</td>
          ))}
          <td style={cellStyle}></td>
        </tr>
        <tr>
          <td style={headerStyle}>Student marks (count x marks)</td>
          <td style={{...cellStyle, backgroundColor: '#e8f5e8', fontWeight: 'bold'}}>
            {cfg.columns.reduce((s, c) => s + (parseInt(student[c.key] || 0) || 0), 0)}
          </td>
          {cfg.columns.map(c => (
            <td key={`sm-${c.key}`} style={cellStyle}>{student[c.key] || 0}</td>
          ))}
          <td style={{...cellStyle, backgroundColor: '#e8f5e8', fontWeight: 'bold'}}>
            {cfg.columns.reduce((s, c) => s + (parseInt(student[c.key] || 0) || 0), 0)}
          </td>
        </tr>
        <tr>
          <td style={headerStyle}>Mentor marks (count x marks)</td>
          <td style={cellStyle}>
            <input type="number" style={inputStyle} placeholder="Enter marks" />
          </td>
          {cfg.columns.map(c => (
            <td key={`mm-${c.key}`} style={cellStyle}>-</td>
          ))}
          <td style={cellStyle}>0</td>
        </tr>
        <tr>
          <td style={headerStyle}>Proof page number</td>
          <td style={cellStyle}></td>
          {cfg.columns.map(c => (
            <td key={`pf-${c.key}`} style={cellStyle}></td>
          ))}
          <td style={cellStyle}></td>
        </tr>
      </tbody>
    </table>
  );
};

const getSelectedStudentEvents = (selectedStudent) => {
  if (!selectedStudent) return [];
  const subs = selectedStudent.submissions || [];
  const indiv = subs
    .filter(s => s.category === 'individualEvents')
    .sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
  return indiv?.events || [];
};

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
                name: 'Unknown User',
                rollNumber: '',
                year: '',
                section: '',
                semester: '',
                submissions: [],
                activityData: {
                  paperPresentation: { count: 0, studentMarks: 0, proofs: [] },
                  projectPresentation: { count: 0, studentMarks: 0, proofs: [] },
                  technoManagerial: { count: 0, studentMarks: 0, proofs: [] },
                  sportsGames: { count: 0, studentMarks: 0, proofs: [] }
                }
              };

  // Helpers: event config and renderers for structured tables
  const getEventConfig = (key) => {
    const k = (key || '').toLowerCase();
    if (k.includes('paper')) {
      return {
        title: '1. Paper Presentation',
        columns: [
          { key: 'insidePresented', label: 'Inside', points: 5 },
          { key: 'outsidePresented', label: 'Outside', points: 10 },
          { key: 'premierPresented', label: 'Premier', points: 20 },
          { key: 'insidePrize', label: 'Inside', points: 20 },
          { key: 'outsidePrize', label: 'Outside', points: 30 },
          { key: 'premierPrize', label: 'Premier', points: 50 },
        ],
        maxPoints: 75,
        headerGroups: [
          { title: 'Presented', span: 3 },
          { title: 'Prize', span: 3 },
        ],
      };
    }
    if (k.includes('project')) {
      return {
        title: '2. Project Presentation',
        columns: [
          { key: 'insidePresented', label: 'Inside', points: 10 },
          { key: 'outsidePresented', label: 'Outside', points: 15 },
          { key: 'premierPresented', label: 'Premier', points: 20 },
          { key: 'insidePrize', label: 'Inside', points: 20 },
          { key: 'outsidePrize', label: 'Outside', points: 30 },
          { key: 'premierPrize', label: 'Premier', points: 50 },
        ],
        maxPoints: 100,
        headerGroups: [
          { title: 'Presented', span: 3 },
          { title: 'Prize', span: 3 },
        ],
      };
    }
    return null;
  };

  const renderStructuredEventTable = (ev) => {
    const cfg = getEventConfig(ev.key || ev.title || '');
    if (!cfg) return null;
    const counts = ev.values?.counts || {};
    const student = ev.values?.studentMarks || {};
    return (
      <table style={{ ...tableStyle, marginTop: '20px' }} key={ev.key}>
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
            {cfg.columns.slice(0,3).map(c => (
              <td key={`pp-${c.key}`} style={headerStyle}>{c.points}</td>
            ))}
            {cfg.columns.slice(3).map(c => (
              <td key={`pz-${c.key}`} style={headerStyle}>{c.points}</td>
            ))}
            <td style={headerStyle}>{cfg.maxPoints}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowSpan="3" style={headerStyle}>{cfg.title}</td>
            <td style={{...cellStyle, backgroundColor: '#e3f2fd', fontWeight: 'bold'}}>
              {cfg.columns.reduce((s, c) => s + (parseInt(counts[c.key] || 0) || 0), 0)}
            </td>
            {cfg.columns.map(c => (
              <td key={`cnt-${c.key}`} style={cellStyle}>{counts[c.key] || 0}</td>
            ))}
            <td style={cellStyle}></td>
          </tr>
          <tr>
            <td style={headerStyle}>Student marks (count x marks)</td>
            <td style={{...cellStyle, backgroundColor: '#e8f5e8', fontWeight: 'bold'}}>
              {cfg.columns.reduce((s, c) => s + (parseInt(student[c.key] || 0) || 0), 0)}
            </td>
            {cfg.columns.map(c => (
              <td key={`sm-${c.key}`} style={cellStyle}>{student[c.key] || 0}</td>
            ))}
            <td style={{...cellStyle, backgroundColor: '#e8f5e8', fontWeight: 'bold'}}>
              {cfg.columns.reduce((s, c) => s + (parseInt(student[c.key] || 0) || 0), 0)}
            </td>
          </tr>
          <tr>
            <td style={headerStyle}>Mentor marks (count x marks)</td>
            <td style={cellStyle}>
              <input type="number" style={inputStyle} placeholder="Enter marks" />
            </td>
            {cfg.columns.map(c => (
              <td key={`mm-${c.key}`} style={cellStyle}>-</td>
            ))}
            <td style={cellStyle}>0</td>
          </tr>
          <tr>
            <td style={headerStyle}>Proof page number</td>
            <td style={cellStyle}></td>
            {cfg.columns.map(c => (
              <td key={`pf-${c.key}`} style={cellStyle}></td>
            ))}
            <td style={cellStyle}></td>
          </tr>
        </tbody>
      </table>
    );
  };

  const getSelectedStudentEvents = () => {
    if (!selectedStudent) return [];
    const subs = selectedStudent.submissions || [];
    const indiv = subs
      .filter(s => s.category === 'individualEvents')
      .sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
    return indiv?.events || [];
  };
            }
            
            // Update student info from any submission that has data
            if (sub.name && sub.name.trim() !== '') {
              grouped[sub.email].name = sub.name;
            }
            if (sub.userName && sub.userName.trim() !== '') {
              grouped[sub.email].name = sub.userName;
            }
            if (sub.studentName && sub.studentName.trim() !== '') {
              grouped[sub.email].name = sub.studentName;
            }
            
            // Extract student details from various sources
            if (sub.rollNumber) grouped[sub.email].rollNumber = sub.rollNumber;
            if (sub.year) grouped[sub.email].year = sub.year;
            if (sub.section) grouped[sub.email].section = sub.section;
            if (sub.semester) grouped[sub.email].semester = sub.semester;
            
            if (sub.details) {
              if (sub.details.rollNumber) grouped[sub.email].rollNumber = sub.details.rollNumber;
              if (sub.details.year) grouped[sub.email].year = sub.details.year;
              if (sub.details.section) grouped[sub.email].section = sub.details.section;
              if (sub.details.semester) grouped[sub.email].semester = sub.details.semester;
              if (sub.details.name) grouped[sub.email].name = sub.details.name;
              if (sub.details.studentName) grouped[sub.email].name = sub.details.studentName;
            }
            grouped[sub.email].submissions.push(sub);
            
            // Parse student data from submissions
            if (sub.events && Array.isArray(sub.events) && sub.events.length > 0) {
              sub.events.forEach(event => {
                console.log('Processing event:', event);
                const activityType = getActivityTypeFromEvent(event.key || event.title || '');
                if (activityType && grouped[sub.email].activityData[activityType]) {
                  // Parse counts from event values
                  let eventCount = 0;
                  let eventMarks = 0;
                  
                  if (event.values) {
                    // Handle different value formats
                    if (typeof event.values === 'object' && event.values !== null) {
                      Object.values(event.values).forEach(val => {
                        if (typeof val === 'number' && val > 0) {
                          eventCount += val;
                        } else if (typeof val === 'string' && !isNaN(val) && val.trim() !== '') {
                          eventCount += parseInt(val);
                        }
                      });
                    } else if (typeof event.values === 'number' && event.values > 0) {
                      eventCount = event.values;
                    } else if (typeof event.values === 'string' && !isNaN(event.values) && event.values.trim() !== '') {
                      eventCount = parseInt(event.values);
                    }
                  }
                  
                  // If no values, check if there's a count field
                  if (eventCount === 0 && event.count) {
                    eventCount = parseInt(event.count) || 0;
                  }
                  
                  // Calculate marks based on activity type and count
                  eventMarks = calculateStudentMarks(activityType, event.key || event.title || '', eventCount);
                  
                  grouped[sub.email].activityData[activityType].count += eventCount;
                  grouped[sub.email].activityData[activityType].studentMarks += eventMarks;
                  
                  // Add proof URLs from event
                  if (event.proofUrls && event.proofUrls.length > 0) {
                    grouped[sub.email].activityData[activityType].proofs.push(...event.proofUrls);
                  }
                }
              });
            }
            
            // Also check submission-level proofUrls
            if (sub.proofUrls && sub.proofUrls.length > 0) {
              // Try to determine activity type from submission activity field
              const activityType = getActivityTypeFromEvent(sub.activity || '');
              if (activityType && grouped[sub.email].activityData[activityType]) {
                grouped[sub.email].activityData[activityType].proofs.push(...sub.proofUrls);
              } else {
                // Add to all activity types if can't determine specific type
                Object.keys(grouped[sub.email].activityData).forEach(type => {
                  grouped[sub.email].activityData[type].proofs.push(...sub.proofUrls);
                });
              }
            }
          });
          setStudents(Object.values(grouped));
          console.log('Processed students with activity data:', Object.values(grouped));
          console.log('Raw submission data:', data);
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

  // Map event keys to activity types
  const getActivityTypeFromEvent = (eventKey) => {
    const key = eventKey.toLowerCase();
    if (key.includes('paper')) return 'paperPresentation';
    if (key.includes('project')) return 'projectPresentation';
    if (key.includes('techno') || key.includes('managerial')) return 'technoManagerial';
    if (key.includes('sports') || key.includes('games')) return 'sportsGames';
    return null;
  };
  
  // Calculate student marks based on activity type and event
  const calculateStudentMarks = (activityType, eventKey, count) => {
    const key = eventKey.toLowerCase();
    
    if (activityType === 'paperPresentation') {
      if (key.includes('inside')) return count * 5;
      if (key.includes('outside') || key.includes('zone')) return count * 20;
      if (key.includes('state')) return count * 40;
      if (key.includes('national') || key.includes('international')) return count * 50;
    }
    
    if (activityType === 'projectPresentation') {
      if (key.includes('inside')) return count * 10;
      if (key.includes('outside') || key.includes('zone')) return count * 15;
      if (key.includes('state')) return count * 20;
      if (key.includes('national') || key.includes('international')) return count * 100;
    }
    
    return count * 5; // Default marks
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

  // Save marks and update student submissions
  const saveStudentMarks = async () => {
    if (!selectedStudent) return;

    try {
      // Calculate mentor total marks
      const mentorMarks = {
        paperPresentation: studentMarks[`${selectedStudent.email}_paperPresentation_mentor_marks`]?.marks || 0,
        projectPresentation: studentMarks[`${selectedStudent.email}_projectPresentation_mentor_marks`]?.marks || 0,
        technoManagerial: studentMarks[`${selectedStudent.email}_technoManagerial_mentor_marks`]?.marks || 0,
        sportsGames: studentMarks[`${selectedStudent.email}_sportsGames_mentor_marks`]?.marks || 0
      };

      const totalMentorMarks = Object.values(mentorMarks).reduce((sum, mark) => sum + mark, 0);

      // Update each submission with mentor marks
      for (const submission of selectedStudent.submissions) {
        const updateRes = await fetch(`http://localhost:8080/api/mentor/update-status/${submission._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'accepted',
            marksAwarded: totalMentorMarks,
            decisionNote: `Mentor evaluated marks: ${totalMentorMarks}`
          })
        });

        if (!updateRes.ok) {
          console.error('Failed to update submission:', submission._id);
        }
      }

      // Save SAP marks data
      const marksData = {
        studentEmail: selectedStudent.email,
        studentName: selectedStudent.name,
        mentorEmail: mentorEmail,
        marks: studentMarks,
        mentorMarks: mentorMarks,
        totalMarks: totalMentorMarks,
        updatedAt: new Date().toISOString()
      };

      const res = await fetch('http://localhost:8080/api/mentor/save-sap-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marksData)
      });

      if (res.ok) {
        alert(`Marks saved successfully! Total mentor marks: ${totalMentorMarks}`);
        // Refresh student data
        window.location.reload();
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

          {/* Student Submitted Proofs (from latest individualEvents submission) */}
          <div style={{ marginBottom: '20px' }}>
            <h3># Student Submitted Proofs</h3>
            {getSelectedStudentEvents().length === 0 ? (
              <div style={{ color: '#888' }}>No proofs uploaded.</div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {getSelectedStudentEvents().map((ev, idx) => (
                  ev.proofUrls && ev.proofUrls.length > 0 && (
                    <div key={ev.key || idx} style={{ marginBottom: '15px' }}>
                      <strong>{ev.title || ev.key}:</strong>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '5px', flexWrap: 'wrap' }}>
                        {ev.proofUrls.map((proof, index) => (
                          <div key={index} style={{ textAlign: 'center' }}>
                            <img
                              src={`http://localhost:8080${proof}`}
                              alt={`${ev.key} proof ${index + 1}`}
                              style={{ width: '120px', height: '120px', objectFit: 'cover', border: '2px solid #007bff', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              onClick={() => window.open(`http://localhost:8080${proof}`, '_blank')}
                              onError={(e) => { e.target.style.border = '2px solid #dc3545'; e.target.alt = 'Failed to load image'; }}
                            />
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>
                              {ev.key} proof {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Render structured tables for each event in latest individualEvents submission */}
          {getSelectedStudentEvents().map((ev, idx) => (
            <div key={ev.key || idx}>
              {renderStructuredEventTable(ev)}
            </div>
          ))}

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
