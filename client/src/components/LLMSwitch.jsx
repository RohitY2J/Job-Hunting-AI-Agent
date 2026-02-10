import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LLMSwitch = () => {
  const [provider, setProvider] = useState('ollama');
  const [available, setAvailable] = useState({ ollama: false, groq: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProvider();
  }, []);

  const fetchProvider = async () => {
    try {
      const response = await axios.get('/api/llm/provider');
      setProvider(response.data.provider);
      setAvailable(response.data.available);
    } catch (error) {
      console.error('Failed to fetch provider:', error);
    }
  };

  const switchProvider = async (newProvider) => {
    setLoading(true);
    try {
      await axios.post('/api/llm/provider', { provider: newProvider });
      setProvider(newProvider);
    } catch (error) {
      console.error('Failed to switch provider:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      alignItems: 'center',
      padding: '1rem',
      background: '#1a1a1a',
      borderRadius: '8px',
      border: '1px solid #2a4a7a'
    }}>
      <span style={{ color: '#ffffff', fontWeight: '600' }}>LLM Provider:</span>
      
      <button
        onClick={() => switchProvider('ollama')}
        disabled={loading || !available.ollama}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: provider === 'ollama' ? '2px solid #5a8fd6' : '1px solid #666',
          background: provider === 'ollama' ? 'rgba(90, 143, 214, 0.2)' : 'transparent',
          color: provider === 'ollama' ? '#5a8fd6' : '#ffffff',
          cursor: available.ollama ? 'pointer' : 'not-allowed',
          opacity: available.ollama ? 1 : 0.5,
          fontWeight: '600'
        }}
      >
        🖥️ Ollama (Local)
      </button>

      <button
        onClick={() => switchProvider('groq')}
        disabled={loading || !available.groq}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: provider === 'groq' ? '2px solid #5a8fd6' : '1px solid #666',
          background: provider === 'groq' ? 'rgba(90, 143, 214, 0.2)' : 'transparent',
          color: provider === 'groq' ? '#5a8fd6' : '#ffffff',
          cursor: available.groq ? 'pointer' : 'not-allowed',
          opacity: available.groq ? 1 : 0.5,
          fontWeight: '600'
        }}
      >
        ☁️ Groq (Cloud)
      </button>

      {loading && <span style={{ color: '#5a8fd6' }}>Switching...</span>}
    </div>
  );
};

export default LLMSwitch;
