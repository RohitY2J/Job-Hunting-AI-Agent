import React, { useState, useEffect } from 'react';
import { FileText, Search, MessageCircle, TrendingUp } from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    matchedJobs: 0,
    resumeScore: 0,
    applications: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const jobsResponse = await axios.get('/api/jobs');
      const jobs = jobsResponse.data;
      
      setStats({
        totalJobs: jobs.length,
        matchedJobs: user.skills.length > 0 ? Math.floor(jobs.length * 0.3) : 0,
        resumeScore: user.resumeAnalyzed ? 85 : 0,
        applications: 0
      });
      
      setRecentJobs(jobs.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Welcome back, {user.name}! 👋</h2>
        <p>Here's your job hunting progress and recommendations.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalJobs}</div>
          <div className="stat-label">Available Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.matchedJobs}</div>
          <div className="stat-label">Matched Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.resumeScore}%</div>
          <div className="stat-label">Resume Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.applications}</div>
          <div className="stat-label">Applications</div>
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button className="btn">
            <FileText size={20} />
            {user.resumeAnalyzed ? 'Update Resume' : 'Upload Resume'}
          </button>
          <button className="btn btn-secondary">
            <Search size={20} />
            Find Jobs
          </button>
          <button className="btn btn-secondary">
            <MessageCircle size={20} />
            Ask AI Assistant
          </button>
          <button className="btn btn-secondary">
            <TrendingUp size={20} />
            View Analytics
          </button>
        </div>
      </div>

      {user.skills.length > 0 && (
        <div className="card">
          <h3>Your Skills</h3>
          <div className="skills-list">
            {user.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Recent Job Opportunities</h3>
        {recentJobs.length > 0 ? (
          <div className="job-grid">
            {recentJobs.map((job, index) => (
              <div key={index} className="job-card">
                <div className="job-title">{job.title}</div>
                <div className="job-company">{job.company}</div>
                <div className="job-location">{job.location}</div>
                <div className="job-description">
                  {job.description.substring(0, 150)}...
                </div>
                <button className="btn" style={{ marginTop: '1rem' }}>
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No jobs available. Try running the job scraper first!</p>
        )}
      </div>

      {!user.resumeAnalyzed && (
        <div className="card" style={{ background: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <h3>🚀 Get Started</h3>
          <p>Upload your resume to get personalized job recommendations and improve your job search success rate!</p>
          <button className="btn" style={{ marginTop: '1rem' }}>
            <FileText size={20} />
            Upload Resume Now
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;