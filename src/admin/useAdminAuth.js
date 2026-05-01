import { useState, useEffect, useCallback } from 'react';

export function useAdminAuth() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedAdmin = sessionStorage.getItem('admin_session');
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch (e) {
        sessionStorage.removeItem('admin_session');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const adminData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role
        };

        setAdmin(adminData);
        sessionStorage.setItem('admin_session', JSON.stringify(adminData));
        setLoading(false);
        return true;
      } else {
        setError(data.message || 'Invalid email or password.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.warn("Backend unreachable. Triggering local fallback for presentation.");
      
      const team = [
        { email: 'omar@coffee.com', pass: 'omar2026', name: 'Omar Al-Ajarma', role: 'super_admin' },
        { email: 'sultan@coffee.com', pass: 'sultan2026', name: 'Sultan Al-Adawi', role: 'admin' },
        { email: 'mohammad@coffee.com', pass: 'mohammad2026', name: 'Mohammad Al-Hadidi', role: 'admin' },
        { email: 'bashar@coffee.com', pass: 'bashar2026', name: 'Bashar Al-Dabbas', role: 'admin' }
      ];
      
      const user = team.find(u => u.email === email.toLowerCase().trim() && u.pass === password);
      
      if (user) {
        const fallbackData = { 
          id: `local-${user.name}`, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        };
        setAdmin(fallbackData);
        sessionStorage.setItem('admin_session', JSON.stringify(fallbackData));
        setLoading(false);
        return true;
      }

      setError('Connection error or invalid credentials.');
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_session');
    setAdmin(null);
  }, []);

  return { admin, loading, error, login, logout, isAdmin: !!admin };
}