// src/hooks/useAuth.js - Custom auth hook
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/auth/status', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.logged) {
          setIsAuthenticated(true);
          setUser({ email: data.email });
          localStorage.setItem('adminEmail', data.email);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('adminEmail');
        }
      } catch {
        setIsAuthenticated(false);
        localStorage.removeItem('adminEmail');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  return { isAuthenticated, loading, user };
};
