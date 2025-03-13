import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'


import Login from "./pages/Auth/Login";
import Home from "./pages/Home/Home";
import SignUp from './pages/Auth/SignUp';
const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Home/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp/>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App