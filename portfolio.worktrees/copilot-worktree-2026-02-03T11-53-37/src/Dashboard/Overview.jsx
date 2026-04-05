import React, { useEffect, useState } from 'react';
import { useTheme } from './DashboardLayout';

export default function Overview() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState({
    visits: 0,
    clicks: 0,
    messages: 0,
    cookiesAccepted: 0,
    totalTimeSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/dashboard/overview', {
      credentials: 'include'
    })
      .then(res => {
        if (res.status === 401) {
          window.location.href = '/admin';
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching overview:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: currentTheme.color, padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ color: currentTheme.color }}>
      <h1 style={{ marginBottom: '30px', color: currentTheme.accentColor }}>Overview</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${currentTheme.sidebarBorder}`
        }}>
          <h3 style={{ color: currentTheme.textSecondary, marginBottom: '10px' }}>Total Visits</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', color: currentTheme.accentColor }}>
            {data.visits}
          </p>
        </div>

        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${currentTheme.sidebarBorder}`
        }}>
          <h3 style={{ color: currentTheme.textSecondary, marginBottom: '10px' }}>Total Clicks</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', color: currentTheme.accentColor }}>
            {data.clicks}
          </p>
        </div>

        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${currentTheme.sidebarBorder}`
        }}>
          <h3 style={{ color: currentTheme.textSecondary, marginBottom: '10px' }}>Messages</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', color: currentTheme.accentColor }}>
            {data.messages}
          </p>
        </div>

        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${currentTheme.sidebarBorder}`
        }}>
          <h3 style={{ color: currentTheme.textSecondary, marginBottom: '10px' }}>Cookies Accepted</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', color: currentTheme.accentColor }}>
            {data.cookiesAccepted}
          </p>
        </div>

        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '20px',
          borderRadius: '10px',
          border: `1px solid ${currentTheme.sidebarBorder}`
        }}>
          <h3 style={{ color: currentTheme.textSecondary, marginBottom: '10px' }}>Total Time Spent</h3>
          <p style={{ fontSize: '2em', fontWeight: 'bold', color: currentTheme.accentColor }}>
            {Math.floor(data.totalTimeSpent / 60)}m {data.totalTimeSpent % 60}s
          </p>
        </div>
      </div>
    </div>
  );
}
