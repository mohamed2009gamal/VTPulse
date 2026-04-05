import React, { useCallback, useMemo } from 'react';
import usePollingData from '../hooks/usePollingData';
import { apiCall } from '../services/api';
import { formatDateTime, formatDuration, formatNumber, formatRelativeTime, normalizePath } from './dashboardUtils';

const initialAnalytics = {
  recentVisits: [],
  recentClicks: [],
  recentCookies: [],
  cookieStats: { accepted: 0, rejected: 0 },
  visitsByPath: {},
  visitsByHour: [],
  clicksByElement: [],
  summary: {
    activeVisits: 0,
    clicksLastHour: 0,
    messagesToday: 0,
    trackedPages: 0
  },
  lastUpdated: null
};

const normalizeAnalytics = (payload = {}) => ({
  ...initialAnalytics,
  ...payload,
  recentVisits: Array.isArray(payload.recentVisits) ? payload.recentVisits : initialAnalytics.recentVisits,
  recentClicks: Array.isArray(payload.recentClicks) ? payload.recentClicks : initialAnalytics.recentClicks,
  recentCookies: Array.isArray(payload.recentCookies) ? payload.recentCookies : initialAnalytics.recentCookies,
  visitsByPath: payload.visitsByPath && typeof payload.visitsByPath === 'object' ? payload.visitsByPath : initialAnalytics.visitsByPath,
  visitsByHour: Array.isArray(payload.visitsByHour) ? payload.visitsByHour : initialAnalytics.visitsByHour,
  clicksByElement: Array.isArray(payload.clicksByElement) ? payload.clicksByElement : initialAnalytics.clicksByElement,
  cookieStats: {
    ...initialAnalytics.cookieStats,
    ...(payload.cookieStats || {})
  },
  summary: {
    ...initialAnalytics.summary,
    ...(payload.summary || {})
  }
});

export default function Analytics() {
  const loadAnalytics = useCallback(async () => {
    try {
      const payload = await apiCall('/dashboard/analytics');
      return normalizeAnalytics(payload);
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = '/admin';
        return initialAnalytics;
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
  } = usePollingData(loadAnalytics, {
    initialData: initialAnalytics,
    interval: 8000
  });

  const analytics = normalizeAnalytics(data);

  const topPaths = useMemo(
    () =>
      Object.entries(analytics.visitsByPath)
        .map(([path, stats]) => ({
          path,
          count: stats.count,
          totalTime: stats.totalTime
        }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 8),
    [analytics.visitsByPath]
  );

  const busiestHour = useMemo(() => {
    if (!analytics.visitsByHour.length) {
      return null;
    }

    return analytics.visitsByHour.reduce((max, current) => (current.count > max.count ? current : max), analytics.visitsByHour[0]);
  }, [analytics.visitsByHour]);

  const maxHourCount = Math.max(...analytics.visitsByHour.map((item) => item.count), 1);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">Live telemetry</span>
          <h1 className="dashboard-page-title">Analytics</h1>
          <p className="dashboard-page-copy">
            Watch routes, clicks, cookies, and recent behavior refresh in near real time from the tracking layer.
          </p>
        </div>
        <div className="dashboard-page-actions">
          <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => refresh(true)}>
            Refresh
          </button>
          <span className="dashboard-status-badge">
            <span className="dashboard-live-dot" />
            {refreshing ? 'Refreshing telemetry...' : `Updated ${formatRelativeTime(lastUpdated || analytics.lastUpdated)}`}
          </span>
        </div>
      </section>

      {error && <div className="dashboard-banner dashboard-banner-error">{error}</div>}

      <section className="dashboard-kpi-grid">
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Active visitors</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(analytics.summary.activeVisits)}</strong>
          <span className="dashboard-kpi-meta">Detected in the last 5 minutes</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Clicks last hour</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(analytics.summary.clicksLastHour)}</strong>
          <span className="dashboard-kpi-meta">Interaction velocity</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Tracked pages</span>
          <strong className="dashboard-kpi-value">{loading ? '...' : formatNumber(analytics.summary.trackedPages)}</strong>
          <span className="dashboard-kpi-meta">Routes with recorded traffic</span>
        </article>
        <article className="dashboard-kpi-card">
          <span className="dashboard-kpi-label">Cookie acceptance</span>
          <strong className="dashboard-kpi-value">
            {loading ? '...' : `${formatNumber(analytics.cookieStats.accepted)} / ${formatNumber(analytics.cookieStats.rejected)}`}
          </strong>
          <span className="dashboard-kpi-meta">Accepted vs rejected</span>
        </article>
      </section>

      <section className="dashboard-panel-grid dashboard-panel-grid-two">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Page traffic</h2>
              <p className="dashboard-panel-copy">Where visitors spend their time and how often they arrive.</p>
            </div>
          </div>
          {topPaths.length === 0 ? (
            <div className="dashboard-empty">No tracked page traffic yet.</div>
          ) : (
            <div className="dashboard-list">
              {topPaths.map((entry) => (
                <div className="dashboard-list-item" key={entry.path}>
                  <div>
                    <strong>{normalizePath(entry.path)}</strong>
                    <p>{formatDuration(entry.totalTime)} total engagement</p>
                  </div>
                  <span className="dashboard-chip">{formatNumber(entry.count)} visits</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Click hotspots</h2>
              <p className="dashboard-panel-copy">Most frequently tapped or clicked controls across the public site.</p>
            </div>
          </div>
          {analytics.clicksByElement.length === 0 ? (
            <div className="dashboard-empty">No click data recorded yet.</div>
          ) : (
            <div className="dashboard-list">
              {analytics.clicksByElement.map((entry) => (
                <div className="dashboard-list-item" key={entry.element}>
                  <div>
                    <strong>{entry.element}</strong>
                    <p>Tracked interaction target</p>
                  </div>
                  <span className="dashboard-chip">{formatNumber(entry.count)} clicks</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-panel-grid dashboard-panel-grid-two">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Visits by hour</h2>
              <p className="dashboard-panel-copy">
                {busiestHour
                  ? `Peak bucket: ${new Date(busiestHour.hour).toLocaleTimeString([], { hour: 'numeric' })}`
                  : 'Waiting for enough recent visits to form a chart.'}
              </p>
            </div>
          </div>
          {analytics.visitsByHour.length === 0 ? (
            <div className="dashboard-empty">No hourly traffic to chart yet.</div>
          ) : (
            <div className="dashboard-bar-chart">
              {analytics.visitsByHour.map((entry) => (
                <div className="dashboard-bar-row" key={entry.hour}>
                  <span className="dashboard-bar-label">
                    {new Date(entry.hour).toLocaleTimeString([], { hour: 'numeric' })}
                  </span>
                  <div className="dashboard-bar-track">
                    <div
                      className="dashboard-bar-fill"
                      style={{ width: `${(entry.count / maxHourCount) * 100}%` }}
                    />
                  </div>
                  <span className="dashboard-bar-value">{formatNumber(entry.count)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Cookie events</h2>
              <p className="dashboard-panel-copy">Latest consent choices recorded from the banner interaction.</p>
            </div>
          </div>
          {analytics.recentCookies.length === 0 ? (
            <div className="dashboard-empty">No cookie choices have been tracked yet.</div>
          ) : (
            <div className="dashboard-list">
              {analytics.recentCookies.map((entry) => (
                <div className="dashboard-list-item" key={entry._id}>
                  <div>
                    <strong>{entry.status === 'accepted' ? 'Accepted' : 'Rejected'}</strong>
                    <p>{formatDateTime(entry.createdAt)}</p>
                  </div>
                  <span className={`dashboard-chip ${entry.status === 'accepted' ? 'dashboard-chip-success' : 'dashboard-chip-danger'}`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-panel-grid dashboard-panel-grid-two">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Recent visits</h2>
              <p className="dashboard-panel-copy">Fresh page entries with recorded dwell time.</p>
            </div>
          </div>
          {analytics.recentVisits.length === 0 ? (
            <div className="dashboard-empty">No recent visits yet.</div>
          ) : (
            <div className="dashboard-list">
              {analytics.recentVisits.map((visit) => (
                <div className="dashboard-list-item" key={visit._id}>
                  <div>
                    <strong>{normalizePath(visit.path)}</strong>
                    <p>{formatDateTime(visit.createdAt)}</p>
                  </div>
                  <span className="dashboard-chip">{formatDuration(visit.timeSpent)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">Recent clicks</h2>
              <p className="dashboard-panel-copy">Latest interaction events captured from public pages.</p>
            </div>
          </div>
          {analytics.recentClicks.length === 0 ? (
            <div className="dashboard-empty">No recent clicks yet.</div>
          ) : (
            <div className="dashboard-list">
              {analytics.recentClicks.map((click) => (
                <div className="dashboard-list-item" key={click._id}>
                  <div>
                    <strong>{click.element || 'Unknown element'}</strong>
                    <p>{normalizePath(click.path)}</p>
                  </div>
                  <span className="dashboard-chip">{formatRelativeTime(click.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
