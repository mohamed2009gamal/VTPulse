import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import usePollingData from '../hooks/usePollingData';
import { apiCall } from '../services/api';
import { formatDateTime, formatRelativeTime } from './dashboardUtils';

export default function Settings() {
  const history = useHistory();
  const { theme, setThemeMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [notifications, setNotifications] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState('');

  const [adminEmail, setAdminEmail] = useState(localStorage.getItem('adminEmail') || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminGoogleAllowed, setNewAdminGoogleAllowed] = useState(false);
  const [newAdminLocalAllowed, setNewAdminLocalAllowed] = useState(true);
  const [newAdminMessage, setNewAdminMessage] = useState('');
  const [newAdminLoading, setNewAdminLoading] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [approvalLoadingId, setApprovalLoadingId] = useState('');

  const loadAdmins = useCallback(async () => {
    try {
      const admins = await apiCall('/auth/admin/list');
      return Array.isArray(admins) ? admins : [];
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = '/admin';
        return [];
      }
      throw err;
    }
  }, []);

  const {
    data: admins,
    setData: setAdmins,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh
  } = usePollingData(loadAdmins, {
    initialData: [],
    interval: 30000
  });

  const pendingAdmins = admins.filter((admin) => admin.approvalStatus === 'pending');
  const approvedAdmins = admins.filter((admin) => (admin.approvalStatus || 'approved') === 'approved');
  const declinedAdmins = admins.filter((admin) => admin.approvalStatus === 'declined');

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  useEffect(() => {
    const storedNotifications = localStorage.getItem('dashboardNotifications') === 'true';
    setNotifications(storedNotifications);
  }, []);

  const handleSavePreferences = () => {
    setThemeMode(selectedTheme);
    localStorage.setItem('dashboardNotifications', notifications ? 'true' : 'false');
    setPreferencesMessage('Dashboard preferences saved.');
    window.setTimeout(() => setPreferencesMessage(''), 2400);
  };

  const handleUpdateCredentials = async (event) => {
    event.preventDefault();
    setAccountMessage('');

    if (!currentPassword) {
      setAccountMessage('Current password is required.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setAccountMessage('New password and confirmation do not match.');
      return;
    }

    try {
      setAccountLoading(true);
      const data = await apiCall('/auth/admin/credentials', {
        method: 'PUT',
        body: JSON.stringify({
          email: adminEmail,
          currentPassword,
          newPassword: newPassword || undefined
        })
      });

      if (data?.email) {
        localStorage.setItem('adminEmail', data.email);
        setAdminEmail(data.email);
      }

      setAccountMessage(data?.message || 'Login information updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refresh(true);
    } catch (err) {
      setAccountMessage(err?.message || 'Failed to update login information.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete this admin account and log out?')) {
      return;
    }

    try {
      setAccountLoading(true);
      const data = await apiCall('/auth/admin', {
        method: 'DELETE'
      });
      localStorage.removeItem('adminEmail');
      window.alert(data?.message || 'Admin account deleted.');
      history.push('/admin');
    } catch (err) {
      setAccountMessage(err?.message || 'Failed to delete admin account.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccessToggle = async (adminId, field, value) => {
    try {
      const response = await apiCall(`/auth/admin/${adminId}/access`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: value })
      });

      setAdmins((prev) =>
        prev.map((admin) => (admin._id === adminId ? { ...admin, ...response.admin } : admin))
      );
    } catch (err) {
      window.alert(err?.message || 'Failed to update admin access.');
    }
  };

  const handleApprovalDecision = async (adminId, approvalStatus) => {
    try {
      setApprovalLoadingId(adminId);
      setApprovalMessage('');

      const response = await apiCall(`/auth/admin/${adminId}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ approvalStatus })
      });

      setAdmins((prev) =>
        prev.map((admin) => (admin._id === adminId ? { ...admin, ...response.admin } : admin))
      );
      setApprovalMessage(response?.message || 'Registration status updated.');
    } catch (err) {
      setApprovalMessage(err?.message || 'Failed to update registration approval.');
    } finally {
      setApprovalLoadingId('');
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setNewAdminMessage('');

    if (!newAdminEmail || !newAdminPassword) {
      setNewAdminMessage('Email and password are required.');
      return;
    }

    try {
      setNewAdminLoading(true);
      const data = await apiCall('/auth/admin', {
        method: 'POST',
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
          localAllowed: newAdminLocalAllowed,
          googleAllowed: newAdminGoogleAllowed
        })
      });

      setNewAdminMessage(data?.message || 'New admin created.');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminLocalAllowed(true);
      setNewAdminGoogleAllowed(false);
      await refresh(true);
    } catch (err) {
      setNewAdminMessage(err?.message || 'Failed to create admin.');
    } finally {
      setNewAdminLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Configuration</span>
          <h1 className="dashboard-page-title">Settings</h1>
          <p className="dashboard-page-copy">
            Control the dashboard theme, update your admin login, and manage who can access the control center.
          </p>
        </div>
        <div className="dashboard-page-actions">
          <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => refresh(true)}>
            Refresh
          </button>
          <span className="dashboard-status-badge">
            <span className="dashboard-live-dot" />
            {refreshing ? 'Refreshing access list...' : `Updated ${formatRelativeTime(lastUpdated)}`}
          </span>
        </div>
      </section>

      {error && <div className="dashboard-banner dashboard-banner-error">{error}</div>}
      {preferencesMessage && <div className="dashboard-banner">{preferencesMessage}</div>}
      {accountMessage && (
        <div className={`dashboard-banner ${accountMessage.toLowerCase().includes('success') ? '' : 'dashboard-banner-error'}`}>
          {accountMessage}
        </div>
      )}
      {newAdminMessage && (
        <div className={`dashboard-banner ${newAdminMessage.toLowerCase().includes('failed') ? 'dashboard-banner-error' : ''}`}>
          {newAdminMessage}
        </div>
      )}
      {approvalMessage && (
        <div className={`dashboard-banner ${approvalMessage.toLowerCase().includes('failed') || approvalMessage.toLowerCase().includes('cannot') ? 'dashboard-banner-error' : ''}`}>
          {approvalMessage}
        </div>
      )}

      <article className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Registration approvals</h2>
            <p className="dashboard-panel-copy">Review new dashboard access requests and approve or decline them directly from here.</p>
          </div>
        </div>

        {pendingAdmins.length === 0 ? (
          <div className="dashboard-empty">No pending registration requests.</div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAdmins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.name || 'Not provided'}</td>
                    <td>{admin.email}</td>
                    <td>{formatDateTime(admin.createdAt)}</td>
                    <td>
                      <span className="dashboard-chip">Pending</span>
                    </td>
                    <td>
                      <div className="dashboard-form-actions">
                        <button
                          type="button"
                          className="dashboard-button"
                          onClick={() => handleApprovalDecision(admin._id, 'approved')}
                          disabled={approvalLoadingId === admin._id}
                        >
                          {approvalLoadingId === admin._id ? 'Working...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="dashboard-button dashboard-button-danger"
                          onClick={() => handleApprovalDecision(admin._id, 'declined')}
                          disabled={approvalLoadingId === admin._id}
                        >
                          {approvalLoadingId === admin._id ? 'Working...' : 'Decline'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <section className="dashboard-panel-grid dashboard-panel-grid-two">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Dashboard preferences</h2>
              <p className="dashboard-panel-copy">Choose the visual mode and whether the dashboard may save notification preferences locally.</p>
            </div>
          </div>

          <div className="dashboard-form-grid">
            <label className="dashboard-field">
              <span>Theme</span>
              <select className="dashboard-input" value={selectedTheme} onChange={(event) => setSelectedTheme(event.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>

            <label className="dashboard-checkbox-row">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(event) => setNotifications(event.target.checked)}
              />
              <span>Keep notification preference stored on this device</span>
            </label>
          </div>

          <div className="dashboard-form-actions">
            <button type="button" className="dashboard-button" onClick={handleSavePreferences}>
              Save preferences
            </button>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Session summary</h2>
              <p className="dashboard-panel-copy">Current dashboard session metadata and access state.</p>
            </div>
          </div>

          <div className="dashboard-list">
            <div className="dashboard-list-item">
              <div>
                <strong>Signed-in admin</strong>
                <p>{adminEmail || 'Unknown'}</p>
              </div>
              <span className="dashboard-chip">Active</span>
            </div>
            <div className="dashboard-list-item">
              <div>
                <strong>Theme mode</strong>
                <p>{theme}</p>
              </div>
              <span className="dashboard-chip">Synced</span>
            </div>
            <div className="dashboard-list-item">
              <div>
                <strong>Admin accounts</strong>
                <p>{approvedAdmins.length} approved account(s)</p>
              </div>
              <span className="dashboard-chip">{loading ? 'Loading' : 'Ready'}</span>
            </div>
            <div className="dashboard-list-item">
              <div>
                <strong>Pending approvals</strong>
                <p>{pendingAdmins.length} waiting for review</p>
              </div>
              <span className="dashboard-chip">{pendingAdmins.length ? 'Review needed' : 'Clear'}</span>
            </div>
            <div className="dashboard-list-item">
              <div>
                <strong>Declined requests</strong>
                <p>{declinedAdmins.length} declined account(s)</p>
              </div>
              <span className="dashboard-chip">{declinedAdmins.length ? 'History' : 'None'}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-panel-grid dashboard-panel-grid-two">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Admin login</h2>
              <p className="dashboard-panel-copy">Update the email or password used to access the dashboard.</p>
            </div>
          </div>

          <form className="dashboard-form-grid" onSubmit={handleUpdateCredentials}>
            <label className="dashboard-field">
              <span>Admin email</span>
              <input className="dashboard-input" type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
            </label>

            <label className="dashboard-field">
              <span>Current password</span>
              <input className="dashboard-input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </label>

            <label className="dashboard-field">
              <span>New password</span>
              <input className="dashboard-input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>

            <label className="dashboard-field">
              <span>Confirm new password</span>
              <input className="dashboard-input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>

            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-button" disabled={accountLoading}>
                {accountLoading ? 'Saving...' : 'Save login changes'}
              </button>
              <button type="button" className="dashboard-button dashboard-button-danger" onClick={handleDeleteAccount} disabled={accountLoading}>
                Delete admin account
              </button>
            </div>
          </form>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Create admin</h2>
              <p className="dashboard-panel-copy">Provision a new admin account from inside the dashboard. Accounts created here are approved immediately.</p>
            </div>
          </div>

          <form className="dashboard-form-grid" onSubmit={handleCreateAdmin}>
            <label className="dashboard-field">
              <span>Name</span>
              <input className="dashboard-input" type="text" value={newAdminName} onChange={(event) => setNewAdminName(event.target.value)} />
            </label>

            <label className="dashboard-field">
              <span>Email</span>
              <input className="dashboard-input" type="email" value={newAdminEmail} onChange={(event) => setNewAdminEmail(event.target.value)} />
            </label>

            <label className="dashboard-field">
              <span>Password</span>
              <input className="dashboard-input" type="password" value={newAdminPassword} onChange={(event) => setNewAdminPassword(event.target.value)} />
            </label>

            <label className="dashboard-checkbox-row">
              <input
                type="checkbox"
                checked={newAdminLocalAllowed}
                onChange={(event) => setNewAdminLocalAllowed(event.target.checked)}
              />
              <span>Allow email and password login</span>
            </label>

            <label className="dashboard-checkbox-row">
              <input
                type="checkbox"
                checked={newAdminGoogleAllowed}
                onChange={(event) => setNewAdminGoogleAllowed(event.target.checked)}
              />
              <span>Allow Google login</span>
            </label>

            <div className="dashboard-form-actions">
              <button type="submit" className="dashboard-button" disabled={newAdminLoading}>
                {newAdminLoading ? 'Creating...' : 'Create admin'}
              </button>
            </div>
          </form>
        </article>
      </section>

      <article className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Admin access control</h2>
            <p className="dashboard-panel-copy">Enable or disable login methods for each approved admin account.</p>
          </div>
        </div>

        {approvedAdmins.length === 0 && !loading ? (
          <div className="dashboard-empty">No approved admin accounts found.</div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Local login</th>
                  <th>Google login</th>
                </tr>
              </thead>
              <tbody>
                {approvedAdmins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.name || 'Not provided'}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className="dashboard-chip">Approved</span>
                    </td>
                    <td>{formatDateTime(admin.createdAt)}</td>
                    <td>
                      <label className="dashboard-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={admin.localAllowed !== false}
                          onChange={(event) => handleAccessToggle(admin._id, 'localAllowed', event.target.checked)}
                        />
                        <span>{admin.localAllowed !== false ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </td>
                    <td>
                      <label className="dashboard-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={admin.googleAllowed !== false}
                          onChange={(event) => handleAccessToggle(admin._id, 'googleAllowed', event.target.checked)}
                        />
                        <span>{admin.googleAllowed !== false ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
