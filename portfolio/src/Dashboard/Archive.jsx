import React, { useCallback, useMemo } from 'react';
import BlogCard from '../Components/BlogsSection/BlogCard';
import usePollingData from '../hooks/usePollingData';
import { apiCall } from '../services/api';
import { formatDateTime, formatNumber, formatRelativeTime } from './dashboardUtils';

const initialArchive = {
  archivedBlogs: [],
  deletedAdmins: [],
  adminAudit: []
};

export default function Archive() {
  const loadArchive = useCallback(async () => {
    try {
      const [archivedBlogs, deletedAdmins, adminAudit] = await Promise.all([
        apiCall('/blogs?archived=true'),
        apiCall('/admin-archive/deleted'),
        apiCall('/admin-archive/audit')
      ]);

      return {
        archivedBlogs: Array.isArray(archivedBlogs) ? archivedBlogs : [],
        deletedAdmins: Array.isArray(deletedAdmins) ? deletedAdmins : [],
        adminAudit: Array.isArray(adminAudit) ? adminAudit : []
      };
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = '/admin';
        return initialArchive;
      }
      throw err;
    }
  }, []);

  const {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh
  } = usePollingData(loadArchive, {
    initialData: initialArchive,
    interval: 20000
  });

  const handleRestoreBlog = async (blog) => {
    try {
      await apiCall(`/blogs/${blog._id}/restore`, {
        method: 'PUT'
      });
      await refresh(true);
    } catch (err) {
      window.alert(err?.message || 'Failed to restore blog.');
    }
  };

  const deletedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return data.deletedAdmins.filter((admin) => admin.deletedAt && new Date(admin.deletedAt).getTime() >= cutoff).length;
  }, [data.deletedAdmins]);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Recovery and history</span>
          <h1 className="dashboard-page-title">Archive</h1>
          <p className="dashboard-page-copy">
            Restore archived content, review deleted admin accounts, and inspect the audit trail of login-related changes.
          </p>
        </div>
        <div className="dashboard-page-actions">
          <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => refresh(true)}>
            Refresh
          </button>
          <span className="dashboard-status-badge">
            <span className="dashboard-live-dot" />
            {refreshing ? 'Refreshing archive...' : `Updated ${formatRelativeTime(lastUpdated)}`}
          </span>
        </div>
      </section>

      {error && <div className="dashboard-banner dashboard-banner-error">{error}</div>}

      <section className="dashboard-kpi-grid dashboard-kpi-grid-compact">
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Archived blogs</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(data.archivedBlogs.length)}</strong>
          <span className="dashboard-kpi-meta">Restorable content items</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Deleted admins</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(data.deletedAdmins.length)}</strong>
          <span className="dashboard-kpi-meta">{formatNumber(deletedThisWeek)} deleted this week</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Audit records</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(data.adminAudit.length)}</strong>
          <span className="dashboard-kpi-meta">Credential and login events</span>
        </article>
      </section>

      <article className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2 className="dashboard-panel-title">Archived posts</h2>
            <p className="dashboard-panel-copy">Restore any archived blog directly back into the live catalog.</p>
          </div>
        </div>
        {data.archivedBlogs.length === 0 ? (
          <div className="dashboard-empty">No archived blogs yet.</div>
        ) : (
          <div className="dashboard-blog-grid">
            {data.archivedBlogs.map((blog) => (
              <div key={blog._id} className="dashboard-blog-grid-item">
                <BlogCard blog={blog} showControls={false} isAdmin />
                <div className="dashboard-card-overlay-actions">
                  <span className="dashboard-chip">{blog.archivedAt ? formatDateTime(blog.archivedAt) : 'Archived'}</span>
                  <button type="button" className="dashboard-button" onClick={() => handleRestoreBlog(blog)}>
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <section className="dashboard-panel-grid dashboard-panel-grid-two">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Deleted admin accounts</h2>
              <p className="dashboard-panel-copy">Accounts removed from active access but still retained in history.</p>
            </div>
          </div>
          {data.deletedAdmins.length === 0 ? (
            <div className="dashboard-empty">No deleted admin accounts.</div>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Local</th>
                    <th>Google</th>
                    <th>Deleted at</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deletedAdmins.map((admin) => (
                    <tr key={admin._id}>
                      <td>{admin.email}</td>
                      <td>{admin.localAllowed ? 'Enabled' : 'Disabled'}</td>
                      <td>{admin.googleAllowed ? 'Enabled' : 'Disabled'}</td>
                      <td>{formatDateTime(admin.deletedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Audit trail</h2>
              <p className="dashboard-panel-copy">Recent account creation, login, credential, and deletion history.</p>
            </div>
          </div>
          {data.adminAudit.length === 0 ? (
            <div className="dashboard-empty">No admin audit records yet.</div>
          ) : (
            <div className="dashboard-list">
              {data.adminAudit.map((record) => (
                <div className="dashboard-list-item" key={record._id}>
                  <div>
                    <strong>{record.adminEmail}</strong>
                    <p>{record.action}</p>
                    <p>{record.actorEmail || 'System'}</p>
                  </div>
                  <div className="dashboard-list-meta">
                    <span>{formatDateTime(record.createdAt)}</span>
                    <span className="dashboard-chip">
                      {record.loginMethod ? `${record.loginMethod} login` : 'Audit event'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
