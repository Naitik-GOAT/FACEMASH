import { useEffect, useState } from 'react';

export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Get or create session ID
    let storedSessionId = localStorage.getItem('facemash-session-id');
    
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('facemash-session-id', storedSessionId);
    }
    
    setSessionId(storedSessionId);
  }, []);

  return sessionId;
};