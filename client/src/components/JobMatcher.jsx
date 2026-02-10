import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, ExternalLink, Filter } from 'lucide-react';
import axios from 'axios';

const JobMatcher = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showMatched, setShowMatched] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter, showMatched, user.skills]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Skill matching filter
    if (showMatched && user.skills.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = (job.title + ' ' + job.description).toLowerCase();
        return user.skills.some(skill =>
          jobText.includes(skill.toLowerCase())
        );
      });
    }

    // Sort by relevance (matched skills first)
    if (user.skills.length > 0) {
      filtered.sort((a, b) => {
        const aMatches = countSkillMatches(a, user.skills);
        const bMatches = countSkillMatches(b, user.skills);
        return bMatches - aMatches;
      });
    }

    setFilteredJobs(filtered);
  };

  const countSkillMatches = (job, skills) => {
    const jobText = (job.title + ' ' + job.description).toLowerCase();
    return skills.filter(skill =>
      jobText.includes(skill.toLowerCase())
    ).length;
  };

  const getMatchPercentage = (job) => {
    if (user.skills.length === 0) return 0;
    const matches = countSkillMatches(job, user.skills);
    return Math.round((matches / user.skills.length) * 100);
  };

  const findMatchedJobs = async () => {
    if (user.skills.length === 0) {
      alert('Please upload and analyze your resume first to get personalized job matches.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/jobs/match', {
        skills: user.skills,
        experience: user.experience,
        location: locationFilter
      });
      setFilteredJobs(response.data);
    } catch (error) {
      console.error('Error matching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="job-matcher">
      <div className="card">
        <h2>Job Opportunities</h2>
        <p>Find jobs that match your skills and preferences.</p>
      </div>

      <div className="card">
        <h3>Search & Filter</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Search Jobs</label>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Job title, company, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                className="form-control"
                placeholder="City, state, or remote..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn" onClick={findMatchedJobs}>
            <Filter size={20} />
            Find Matched Jobs
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showMatched}
              onChange={(e) => setShowMatched(e.target.checked)}
            />
            Show only skill matches
          </label>
          
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            {filteredJobs.length} jobs found
          </span>
        </div>
      </div>

      {user.skills.length === 0 && (
        <div className="card" style={{ background: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <h3>💡 Get Better Matches</h3>
          <p>Upload your resume to get personalized job recommendations based on your skills and experience!</p>
        </div>
      )}

      <div className="job-grid">
        {filteredJobs.map((job, index) => {
          const matchPercentage = getMatchPercentage(job);
          
          return (
            <div key={job.id || index} className="job-card">
              {matchPercentage > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '1rem', 
                  right: '1rem', 
                  background: matchPercentage >= 50 ? '#28a745' : '#ffc107',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {matchPercentage}% match
                </div>
              )}
              
              <div className="job-title">{job.title}</div>
              <div className="job-company">
                <Building size={16} style={{ marginRight: '0.5rem' }} />
                {job.company}
              </div>
              <div className="job-location">
                <MapPin size={16} style={{ marginRight: '0.5rem' }} />
                {job.location}
              </div>
              
              {job.salary && (
                <div style={{ color: '#28a745', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {job.salary}
                </div>
              )}
              
              <div className="job-description">
                {job.description}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  {job.source} • {new Date(job.datePosted).toLocaleDateString()}
                </span>
                
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={16} />
                  Apply
                </a>
              </div>
              
              {matchPercentage > 0 && user.skills.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Matching Skills:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {user.skills.filter(skill => 
                      (job.title + ' ' + job.description).toLowerCase().includes(skill.toLowerCase())
                    ).map((skill, skillIndex) => (
                      <span 
                        key={skillIndex} 
                        style={{ 
                          background: '#e3f2fd', 
                          color: '#1976d2', 
                          padding: '0.125rem 0.5rem', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem' 
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No jobs found</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Try adjusting your search criteria or run the job scraper to get fresh listings.
          </p>
          <button className="btn btn-secondary">
            Run Job Scraper
          </button>
        </div>
      )}
    </div>
  );
};

export default JobMatcher;