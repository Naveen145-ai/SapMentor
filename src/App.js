
import Home from './pages/Home/Home';
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
     
         <Route path='/login' element={<Login/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/notification' element={<Notification/>} />
           <Route path="/proofs/:email" element={<StudentProofs />} />
           
      </Routes>
    </Router>
  );
}

export default App;
