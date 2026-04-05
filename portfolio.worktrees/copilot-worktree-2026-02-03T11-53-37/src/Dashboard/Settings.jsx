import React, { useState } from 'react';
import { useTheme } from './DashboardLayout';

export default function Settings() {
  const { theme, toggleTheme, currentTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [notifications, setNotifications] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    toggleTheme(selectedTheme);
    // Here you could save notifications preference to backend/localStorage
    localStorage.setItem('dashboardNotifications', notifications);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ color: currentTheme.color }}>
      <h1 style={{ marginBottom: '30px', color: currentTheme.accentColor }}>Settings</h1>

      <div style={{
        backgroundColor: currentTheme.cardBg,
        padding: '40px',
        borderRadius: '10px',
        border: `1px solid ${currentTheme.sidebarBorder}`
      }}>
        <h2 style={{ marginBottom: '20px', color: currentTheme.textSecondary }}>Dashboard Settings</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: currentTheme.textSecondary }}>
            Theme
          </label>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            style={{
              backgroundColor: currentTheme.inputBg,
              color: currentTheme.color,
              padding: '10px',
              borderRadius: '5px',
              border: `1px solid ${currentTheme.inputBorder}`,
              width: '200px'
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: currentTheme.textSecondary }}>
            Notifications
          </label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          <span style={{ color: currentTheme.color }}>Enable email notifications</span>
        </div>

        <button
          onClick={handleSave}
          style={{
            backgroundColor: currentTheme.buttonBg,
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          {saved ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
