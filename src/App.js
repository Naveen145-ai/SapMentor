
import Home from './pages/Home/Home';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
function App() {
  return (
    <Router>
      <Routes>
      <Route path='/' element={<Home/>}/>
         <Route path='/login' element={<Login/>}/>
            <Route path='/sign-up' element={<SignUp/>}/>
      </Routes>
    </Router>
  );
}

export default App;
