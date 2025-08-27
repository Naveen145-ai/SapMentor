
import Home from './pages/Home/Home';
import MentorDashboard from './pages/MentorDashboard/MentorDashboard';
import SAPMarking from './pages/SAPMarking/SAPMarking';
import EventValidation from './pages/EventValidation/EventValidation';
import SAPFormTable from './pages/SAPFormTable/SAPFormTable';
import CollegeSAPForm from './pages/CollegeSAPForm/CollegeSAPForm';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import Notification from './pages/Notification/Notification';
import StudentProofs from './pages/StudentProofs/StudentProofs';
function App() {
  return (
    <Router>
      <Routes>
         <Route path='/' element={<SignUp/>}/>
         <Route path='/signup' element={<SignUp/>}/>
         <Route path='/login' element={<Login/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/sap-marking' element={<SAPMarking />} />
          <Route path='/sap-form-table' element={<SAPFormTable />} />
          <Route path='/college-sap-form' element={<CollegeSAPForm />} />
        <Route path='/event-validation' element={<EventValidation />} />
          <Route path='/notification' element={<Notification/>} />
           <Route path="/proofs/:email" element={<StudentProofs />} />
           
      </Routes>
    </Router>
  );
}

export default App;
