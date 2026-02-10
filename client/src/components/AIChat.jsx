import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import axios from 'axios';

const AIChat = ({ user }) => {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: "Hi! I'm your AI job hunting assistant. I can help you with resume analysis, job search strategies, interview preparation, and cover letter writing. You can also paste HTML from LinkedIn job pages and I'll extract the jobs for you!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedJobs, setExtractedJobs] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: inputMessage,
        context: {
          skills: user.skills,
          experience: user.experience,
          resumeAnalyzed: user.resumeAnalyzed
        }
      });

      if (response.data.type === 'job_extraction') {
        setExtractedJobs(response.data.data);
        const aiMessage = {
          type: 'ai',
          content: response.data.response,
          timestamp: new Date(),
          hasJobs: true
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const aiMessage = {
          type: 'ai',
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'ai',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveExtractedJobs = async () => {
    if (!extractedJobs) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/jobs/save-extracted', extractedJobs);
      
      const aiMessage = {
        type: 'ai',
        content: `✅ ${response.data.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setExtractedJobs(null);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: '❌ Failed to save jobs. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    "Help me improve my resume",
    "What interview questions should I prepare for?",
    "Write a cover letter for a software developer position",
    "How do I negotiate salary?",
    "What skills should I learn for my career?",
    "Help me find remote job opportunities"
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  return (
    <div className="ai-chat">
      <div className="card">
        <h2>AI Career Assistant</h2>
        <p>Get personalized advice for your job search journey.</p>
      </div>

      <div className="card">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  {message.type === 'ai' ? (
                    <Bot size={20} color="#667eea" />
                  ) : (
                    <User size={20} color="white" />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </div>
                    {message.hasJobs && extractedJobs && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '8px' }}>
                          <strong>📋 Extracted Jobs:</strong>
                          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                            {extractedJobs.jobs.slice(0, 5).map((job, i) => (
                              <li key={i}>{job.title} at {job.company}</li>
                            ))}
                            {extractedJobs.jobs.length > 5 && (
                              <li>...and {extractedJobs.jobs.length - 5} more</li>
                            )}
                          </ul>
                          <button 
                            className="btn" 
                            onClick={saveExtractedJobs}
                            style={{ marginTop: '0.5rem', width: '100%' }}
                          >
                            💾 Save to Database
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.7, 
                      marginTop: '0.5rem' 
                    }}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message ai">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bot size={20} color="#667eea" />
                  <div>Thinking...</div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <textarea
              className="form-control"
              placeholder="Ask me anything or paste LinkedIn HTML here..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              rows={3}
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
            <button 
              className="btn" 
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem' }}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="btn btn-secondary"
              onClick={() => handleQuickAction(action)}
              style={{ 
                textAlign: 'left', 
                padding: '0.75rem',
                fontSize: '0.9rem',
                height: 'auto',
                whiteSpace: 'normal'
              }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {user.resumeAnalyzed && (
        <div className="card">
          <h3>Your Profile Context</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <strong>Skills:</strong>
              <div className="skills-list" style={{ marginTop: '0.5rem' }}>
                {user.skills.slice(0, 5).map((skill, index) => (
                  <span key={index} className="skill-tag" style={{ fontSize: '0.8rem' }}>
                    {skill}
                  </span>
                ))}
                {user.skills.length > 5 && (
                  <span style={{ color: '#666', fontSize: '0.8rem' }}>
                    +{user.skills.length - 5} more
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <strong>Experience:</strong>
              <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                {user.experience}
              </p>
            </div>
          </div>
          
          <p style={{ 
            fontSize: '0.8rem', 
            color: '#666', 
            marginTop: '1rem',
            fontStyle: 'italic'
          }}>
            The AI assistant uses this information to provide personalized advice.
          </p>
        </div>
      )}

      {!user.resumeAnalyzed && (
        <div className="card" style={{ background: '#e3f2fd', border: '1px solid #2196f3' }}>
          <h3>💡 Get Personalized Advice</h3>
          <p>Upload your resume to receive more targeted and personalized career guidance!</p>
          <button className="btn" style={{ marginTop: '1rem' }}>
            Upload Resume
          </button>
        </div>
      )}
    </div>
  );
};

export default AIChat;