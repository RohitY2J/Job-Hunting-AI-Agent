import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FileText, MessageCircle, Search, User, Upload } from 'lucide-react';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import JobMatcher from './components/JobMatcher';
import AIChat from './components/AIChat';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState({
    name: 'Job Seeker',
    resumeAnalyzed: false,
    skills: [],
    experience: ''
  });

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>🤖 AI Job Agent</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">
              <User size={20} />
              Dashboard
            </Link>
            <Link to="/resume" className="nav-link">
              <FileText size={20} />
              Resume
            </Link>
            <Link to="/jobs" className="nav-link">
              <Search size={20} />
              Jobs
            </Link>
            <Link to="/chat" className="nav-link">
              <MessageCircle size={20} />
              AI Chat
            </Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/resume" element={<ResumeAnalyzer setUser={setUser} />} />
            <Route path="/jobs" element={<JobMatcher user={user} />} />
            <Route path="/chat" element={<AIChat user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;