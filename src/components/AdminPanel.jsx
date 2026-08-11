import React, { useState } from 'react'

const DB_URL = 'https://open-message-994d9-default-rtdb.europe-west1.firebasedatabase.app'
const ADMIN_USER = 'techapes'
const ADMIN_PASS = 'vivo123'
const HOURS_TO_SHOW = 24

const toHourBucket = (dateLike) => {
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return null
  d.setMinutes(0, 0, 0)
  return d.toISOString().slice(0, 13)
}

const buildRecentHourlySeries = (hourlyMap = {}, hours = HOURS_TO_SHOW) => {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const series = []
  for (let i = hours - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(now.getHours() - i)
    const key = d.toISOString().slice(0, 13)
    series.push({
      key,
      label: `${d.getHours().toString().padStart(2, '0')}:00`,
      count: Number(hourlyMap[key]) || 0,
    })
  }
  return series
}

const buildPath = (values, width, height, padding) => {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const usableW = width - padding * 2
  const usableH = height - padding * 2
  return values
    .map((value, idx) => {
      const x = padding + (usableW * idx) / Math.max(values.length - 1, 1)
      const y = padding + usableH - (value / max) * usableH
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

export default function AdminPanel() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rejected, setRejected] = useState(() => new Set())
  const [hideRejected, setHideRejected] = useState(true)
  const [visitStats, setVisitStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    hourly: {},
    visits: [],
  })

  const handleLogin = (e) => {
    e.preventDefault()
    if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
      setAuthed(true)
      setError('')
      loadData()
    } else {
      setError('Wrong username or password.')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [submissionRes, analyticsRes] = await Promise.all([
        fetch(`${DB_URL}/sih-team-selection.json`),
        fetch(`${DB_URL}/visitor-analytics.json`),
      ])
      if (!submissionRes.ok) throw new Error(`Failed to read database (HTTP ${submissionRes.status}).`)
      const submissionData = await submissionRes.json()
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null
      const list = submissionData
        ? Object.entries(submissionData).map(([id, record]) => ({ id, ...record }))
        : []
      setRecords(list)
      setRejected(new Set(list.filter((r) => r.rejected === true).map((r) => r.id)))

      const visits = analyticsData?.visits
        ? Object.entries(analyticsData.visits)
            .map(([id, record]) => ({ id, ...record }))
            .filter((record) => !!record.visitedAt)
            .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
        : []

      const mergedHourly = { ...(analyticsData?.hourly || {}) }
      if (Object.keys(mergedHourly).length === 0) {
        visits.forEach((visit) => {
          const key = toHourBucket(visit.visitedAt)
          if (!key) return
          if (mergedHourly[key] == null) mergedHourly[key] = 0
          mergedHourly[key] = Number(mergedHourly[key]) + 1
        })
      }

      setVisitStats({
        totalVisits: Number(analyticsData?.summary?.totalVisits) || visits.length,
        uniqueVisitors: Number(analyticsData?.summary?.uniqueVisitors) || 0,
        hourly: mergedHourly,
        visits,
      })
    } catch (err) {
      setError('Could not load data — ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleReject = async (id) => {
    const wasRejected = rejected.has(id)
    const nowRejected = !wasRejected
    setRejected((prev) => {
      const next = new Set(prev)
      if (nowRejected) next.add(id)
      else next.delete(id)
      return next
    })
    try {
      const res = await fetch(`${DB_URL}/sih-team-selection/${id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejected: nowRejected }),
      })
      if (!res.ok) throw new Error(`Database rejected the write (HTTP ${res.status}).`)
    } catch (err) {
      setError('Could not save rejection — ' + err.message)
      setRejected((prev) => {
        const next = new Set(prev)
        if (wasRejected) next.add(id)
        else next.delete(id)
        return next
      })
    }
  }

  const visibleRecords = records === null
    ? null
    : hideRejected
      ? records.filter((r) => !rejected.has(r.id))
      : records
  const hourlySeries = buildRecentHourlySeries(visitStats.hourly)
  const hourlyValues = hourlySeries.map((point) => point.count)
  const chartWidth = 920
  const chartHeight = 220
  const chartPadding = 22
  const pathData = buildPath(hourlyValues, chartWidth, chartHeight, chartPadding)
  const maxHourly = Math.max(...hourlyValues, 0)

  if (!authed) {
    return (
      <div className="success" style={{ maxWidth: 420, margin: '40px auto' }}>
        <div className="tick" style={{ fontSize: 20 }}>🔒</div>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ textAlign: 'left', marginTop: 20 }}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>
          <button type="submit" className="submit" style={{ width: '100%' }}>Login →</button>
        </form>
        {error && <div className="status err" style={{ display: 'block', marginTop: 16 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-head">
        <div>
          <span className="eyebrow">Admin // Console</span>
          <h2 style={{ fontFamily: 'var(--disp)', fontWeight: 700, margin: '12px 0 4px' }}>Team Selection Data</h2>
          <p style={{ color: 'var(--dim)', fontSize: 13, margin: 0 }}>
            {records === null || loading
              ? 'Loading entries…'
              : `${visibleRecords.length} of ${records.length} submission${records.length === 1 ? '' : 's'} shown.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="filter-label">
            <input
              type="checkbox"
              checked={hideRejected}
              onChange={(e) => setHideRejected(e.target.checked)}
            /> Hide rejected
          </label>
          <button className="btn-ghost" onClick={loadData} style={{ cursor: 'pointer' }}>↻ Refresh</button>
          <button
            className="btn-ghost"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setAuthed(false)
              setRecords(null)
              setUsername('')
              setPassword('')
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {error && <div className="status err" style={{ display: 'block', marginTop: 16 }}>{error}</div>}

      {loading && <div className="status ok" style={{ display: 'block', marginTop: 16 }}>Fetching from Firebase…</div>}

      {!loading && records !== null && visibleRecords.length === 0 && (
        <div className="status ok" style={{ display: 'block', marginTop: 16 }}>
          {records.length === 0 ? 'No submissions yet.' : 'No submissions to show — all filtered out.'}
        </div>
      )}

      {records !== null && visibleRecords.length > 0 && (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Year</th>
                <th>CGPA</th>
                <th>Hackathon Exp</th>
                <th>Expertise</th>
                <th>Languages</th>
                <th>Submitted At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((r, i) => (
                <tr key={r.id} className={rejected.has(r.id) ? 'rejected' : ''}>
                  <td>{i + 1}</td>
                  <td>{r.name || '—'}</td>
                  <td>{r.gender || '—'}</td>
                  <td>{r.contact?.email || '—'}</td>
                  <td>{r.contact?.phone || '—'}</td>
                  <td>{r.department || '—'}</td>
                  <td>{r.year || '—'}</td>
                  <td>{r.cgpa != null ? r.cgpa : '—'}</td>
                  <td>{r.hackathonExperience ?? '—'}</td>
                  <td>{r.expertise || '—'}</td>
                  <td>
                    {Array.isArray(r.languages)
                      ? r.languages.map((l) => `${l.language} (${l.level})`).join(', ')
                      : '—'}
                  </td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className={'reject-btn' + (rejected.has(r.id) ? ' rejected' : '')}
                      onClick={() => toggleReject(r.id)}
                    >
                      {rejected.has(r.id) ? 'Unreject' : 'Reject'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="visit-analytics">
        <div className="visit-head">
          <h3>Visitor Analytics</h3>
          <p>
            Total visits: <b>{visitStats.totalVisits}</b> · Unique visitors: <b>{visitStats.uniqueVisitors}</b>
          </p>
        </div>

        <div className="visit-graph">
          {pathData ? (
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Visitor count per hour">
              <line x1={chartPadding} y1={chartHeight - chartPadding} x2={chartWidth - chartPadding} y2={chartHeight - chartPadding} className="axis" />
              <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={chartHeight - chartPadding} className="axis" />
              <path d={pathData} className="line-path" />
            </svg>
          ) : (
            <div className="status ok" style={{ display: 'block' }}>No visitor data yet.</div>
          )}
          <div className="graph-meta">
            <span>Last {HOURS_TO_SHOW} hours</span>
            <span>Peak/hr: {maxHourly}</span>
          </div>
          <div className="graph-labels">
            {hourlySeries.map((point, idx) => (
              <span key={point.key} className={idx % 3 === 0 ? 'show' : ''}>
                {idx % 3 === 0 ? point.label : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="admin-table" style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Visited At</th>
                <th>Visitor ID</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>VPN</th>
                <th>Browser</th>
                <th>Timezone</th>
              </tr>
            </thead>
            <tbody>
              {visitStats.visits.length === 0 ? (
                <tr>
                  <td colSpan={8}>No visit records yet.</td>
                </tr>
              ) : (
                visitStats.visits.slice(0, 200).map((visit, i) => (
                  <tr key={visit.id}>
                    <td>{i + 1}</td>
                    <td>{new Date(visit.visitedAt).toLocaleString()}</td>
                    <td>{visit.visitorId || '—'}</td>
                    <td>{visit.ipData?.ip || '—'}</td>
                    <td>
                      {[visit.ipData?.location?.city, visit.ipData?.location?.region, visit.ipData?.location?.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </td>
                    <td>{visit.vpnStatus || 'unknown'}</td>
                    <td>{visit.browserData?.userAgent || '—'}</td>
                    <td>{visit.browserData?.timezone || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
