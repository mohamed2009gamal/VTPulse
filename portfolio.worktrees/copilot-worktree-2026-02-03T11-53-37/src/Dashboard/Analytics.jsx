import React, { useEffect, useState } from 'react';
import { useTheme } from './DashboardLayout';

export default function Analytics() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState({
    recentVisits: [],
    recentClicks: [],
    cookieStats: { accepted: 0, rejected: 0 },
    visitsByPath: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/dashboard/analytics', {
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
        console.error('Error fetching analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div style={{ color: 'white' }}>
      <h1 style={{ marginBottom: '30px', color: '#7e22ce' }}>Analytics</h1>
      
      {/* Cookie Stats */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px', fontSize: '20px' }}>Cookie Consent</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ backgroundColor: currentTheme.cardBg, padding: '20px', borderRadius: '10px', border: `1px solid ${currentTheme.sidebarBorder}` }}>
            <p style={{ color: currentTheme.textSecondary, marginBottom: '10px' }}>Accepted</p>
            <p style={{ fontSize: '2em', fontWeight: 'bold', color: currentTheme.accentColor }}>{data.cookieStats.accepted}</p>
          </div>
          <div style={{ backgroundColor: currentTheme.cardBg, padding: '20px', borderRadius: '10px', border: `1px solid ${currentTheme.sidebarBorder}` }}>
            <p style={{ color: currentTheme.textSecondary, marginBottom: '10px' }}>Rejected</p>
            <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#ff4444' }}>{data.cookieStats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Visits by Path */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px', fontSize: '20px' }}>Visits by Page</h2>
        <div style={{ backgroundColor: currentTheme.cardBg, padding: '20px', borderRadius: '10px', border: `1px solid ${currentTheme.sidebarBorder}` }}>
          {Object.keys(data.visitsByPath).length === 0 ? (
            <p style={{ color: currentTheme.textSecondary }}>No page visits recorded yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(data.visitsByPath).map(([path, stats]) => (
                <div key={path} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: currentTheme.inputBg, borderRadius: '5px' }}>
                  <span>{path || '/'}</span>
                  <span style={{ color: currentTheme.accentColor }}>
                    {stats.count} visits • {formatTime(stats.totalTime)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Visits */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px', fontSize: '20px' }}>Recent Visits</h2>
        <div style={{ backgroundColor: currentTheme.cardBg, padding: '20px', borderRadius: '10px', border: `1px solid ${currentTheme.sidebarBorder}`, maxHeight: '300px', overflowY: 'auto' }}>
          {data.recentVisits.length === 0 ? (
            <p style={{ color: currentTheme.textSecondary }}>No visits recorded yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recentVisits.map((visit, idx) => (
                <div key={idx} style={{ padding: '10px', backgroundColor: currentTheme.inputBg, borderRadius: '5px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{visit.path || '/'}</span>
                    <span style={{ color: currentTheme.textSecondary }}>
                      {new Date(visit.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {visit.timeSpent > 0 && (
                    <div style={{ color: currentTheme.accentColor, marginTop: '5px' }}>
                      Time spent: {formatTime(visit.timeSpent)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Clicks */}
      <div>
        <h2 style={{ marginBottom: '15px', fontSize: '20px' }}>Recent Clicks</h2>
        <div style={{ backgroundColor: currentTheme.cardBg, padding: '20px', borderRadius: '10px', border: `1px solid ${currentTheme.sidebarBorder}`, maxHeight: '300px', overflowY: 'auto' }}>
          {data.recentClicks.length === 0 ? (
            <p style={{ color: currentTheme.textSecondary }}>No clicks recorded yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recentClicks.map((click, idx) => (
                <div key={idx} style={{ padding: '10px', backgroundColor: currentTheme.inputBg, borderRadius: '5px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{click.element || 'Unknown'}</span>
                    <span style={{ color: currentTheme.textSecondary }}>
                      {new Date(click.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: currentTheme.textSecondary, marginTop: '5px', fontSize: '12px' }}>
                    Page: {click.path || '/'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
