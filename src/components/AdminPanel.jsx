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
    } catch (err) {
      setError('Could not load data — ' + err.message)
    } finally {
      setLoading(false)
    }
  }

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
              : `${records.length} submission${records.length === 1 ? '' : 's'} in the database.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

      {!loading && records !== null && records.length === 0 && (
        <div className="status ok" style={{ display: 'block', marginTop: 16 }}>No submissions yet.</div>
      )}

      {records !== null && records.length > 0 && (
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
                <th>Hackathon Exp</th>
                <th>Expertise</th>
                <th>Languages</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.name || '—'}</td>
                  <td>{r.gender || '—'}</td>
                  <td>{r.contact?.email || '—'}</td>
                  <td>{r.contact?.phone || '—'}</td>
                  <td>{r.department || '—'}</td>
                  <td>{r.year || '—'}</td>
                  <td>{r.hackathonExperience ?? '—'}</td>
                  <td>{r.expertise || '—'}</td>
                  <td>
                    {Array.isArray(r.languages)
                      ? r.languages.map((l) => `${l.language} (${l.level})`).join(', ')
                      : '—'}
                  </td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
