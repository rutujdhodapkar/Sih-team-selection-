import React, { useState } from 'react'

const DB_URL = 'https://open-message-994d9-default-rtdb.europe-west1.firebasedatabase.app'
const ADMIN_USER = 'techapes'
const ADMIN_PASS = 'vivo123'

export default function AdminPanel() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rejected, setRejected] = useState(() => new Set())
  const [hideRejected, setHideRejected] = useState(true)

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
      const res = await fetch(`${DB_URL}/sih-team-selection.json`)
      if (!res.ok) throw new Error(`Failed to read database (HTTP ${res.status}).`)
      const data = await res.json()
      const list = data
        ? Object.entries(data).map(([id, record]) => ({ id, ...record }))
        : []
      setRecords(list)
      setRejected(new Set(list.filter((r) => r.rejected === true).map((r) => r.id)))
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
    </div>
  )
}
