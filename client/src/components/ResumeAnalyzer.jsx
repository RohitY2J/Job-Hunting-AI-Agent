import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ResumeAnalyzer = ({ setUser }) => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain')) {
      setFile(selectedFile);
      setAnalysis(null);
    } else {
      alert('Please select a PDF or text file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const uploadResume = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post('/api/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysis(response.data.analysis);
      
      // Update user state
      setUser(prev => ({
        ...prev,
        resumeAnalyzed: true,
        skills: response.data.analysis.skills,
        experience: response.data.analysis.experience
      }));

    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="resume-analyzer">
      <div className="card">
        <h2>Resume Analyzer</h2>
        <p>Upload your resume to get detailed analysis and improvement suggestions.</p>
      </div>

      <div className="card">
        <h3>Upload Resume</h3>
        
        <div 
          className={`file-upload ${dragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input').click()}
        >
          <Upload size={48} color="#667eea" />
          <h4>Drop your resume here or click to browse</h4>
          <p>Supports PDF and text files</p>
          
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>

        {file && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} />
              <span>{file.name}</span>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            
            <button 
              className="btn" 
              onClick={uploadResume}
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
          </div>
        )}
      </div>

      {analysis && (
        <div className="card">
          <h3>Analysis Results</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div 
                style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: getScoreColor(analysis.score),
                  marginBottom: '0.5rem'
                }}
              >
                {analysis.score}%
              </div>
              <div style={{ color: '#666' }}>Overall Score</div>
              <div style={{ color: getScoreColor(analysis.score), fontWeight: '600' }}>
                {getScoreLabel(analysis.score)}
              </div>
            </div>
            
            <div>
              <h4>Experience Level</h4>
              <p style={{ color: '#666', marginTop: '0.5rem' }}>{analysis.experience}</p>
            </div>
            
            <div>
              <h4>Education</h4>
              <p style={{ color: '#666', marginTop: '0.5rem' }}>{analysis.education}</p>
            </div>
          </div>

          <div>
            <h4>Detected Skills ({analysis.skills.length})</h4>
            {analysis.skills.length > 0 ? (
              <div className="skills-list" style={{ marginTop: '1rem' }}>
                {analysis.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', marginTop: '0.5rem' }}>
                No technical skills detected. Consider adding more specific skills to your resume.
              </p>
            )}
          </div>
        </div>
      )}

      {analysis && (
        <div className="card">
          <h3>Improvement Suggestions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analysis.score < 80 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={20} color="#ffc107" />
                <div>
                  <strong>Add More Technical Skills</strong>
                  <p style={{ color: '#666', marginTop: '0.25rem' }}>
                    Include more specific programming languages, frameworks, and tools relevant to your target roles.
                  </p>
                </div>
              </div>
            )}
            
            {analysis.experience === 'Not specified' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={20} color="#ffc107" />
                <div>
                  <strong>Quantify Your Experience</strong>
                  <p style={{ color: '#666', marginTop: '0.25rem' }}>
                    Add specific years of experience and quantifiable achievements to strengthen your resume.
                  </p>
                </div>
              </div>
            )}
            
            {analysis.skills.length < 5 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={20} color="#ffc107" />
                <div>
                  <strong>Expand Technical Skills Section</strong>
                  <p style={{ color: '#666', marginTop: '0.25rem' }}>
                    Consider adding more relevant technical skills, certifications, and tools you've worked with.
                  </p>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={20} color="#28a745" />
              <div>
                <strong>Use Action Verbs</strong>
                <p style={{ color: '#666', marginTop: '0.25rem' }}>
                  Start bullet points with strong action verbs like "Developed", "Implemented", "Optimized", etc.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={20} color="#28a745" />
              <div>
                <strong>Include Metrics</strong>
                <p style={{ color: '#666', marginTop: '0.25rem' }}>
                  Add specific numbers, percentages, and measurable outcomes to demonstrate your impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;