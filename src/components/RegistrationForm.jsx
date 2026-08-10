import React, { useState } from 'react'

const DB_URL = 'https://open-message-994d9-default-rtdb.europe-west1.firebasedatabase.app'
const WHATSAPP_GROUP = 'https://chat.whatsapp.com/Ljh9PDnfrDe8jYpJ8YKj26?s=sh&p=a&mlu=4'

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'AI & Machine Learning',
  'Electronics & Telecommunication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate']

const LEVELS = ['Fluent', 'Professional', 'Intermediate', 'Basic']

const initialLanguages = [{ language: 'English', level: 'Fluent' }]

export default function RegistrationForm({ onSuccess }) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [department, setDepartment] = useState('')
  const [departmentOther, setDepartmentOther] = useState('')
  const [year, setYear] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [experience, setExperience] = useState('')
  const [experienceOther, setExperienceOther] = useState('')
  const [expertise, setExpertise] = useState('')
  const [languages, setLanguages] = useState(initialLanguages)
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  const addLanguage = () => setLanguages((prev) => [...prev, { language: '', level: 'Fluent' }])
  const removeLanguage = (idx) =>
    setLanguages((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
  const updateLanguage = (idx, key, value) =>
    setLanguages((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)))

  const showStatus = (msg, ok) => setStatus({ msg, ok })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)

    const trimmedName = name.trim()
    const trimmedDept = department === '__other' ? departmentOther.trim() : department
    const expRaw = experience === '__other' ? experienceOther.trim() : experience
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName || !gender || !trimmedEmail || !trimmedPhone || !trimmedDept || !year || expRaw === '') {
      showStatus('Fill every required field before submitting.', false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showStatus('Enter a valid email address.', false)
      return
    }
    if (!/^[0-9+\-\s()]{7,15}$/.test(trimmedPhone)) {
      showStatus('Enter a valid phone number.', false)
      return
    }
    if (!expertise.trim()) {
      showStatus('Tell us your expertise. Nobody has zero skills.', false)
      return
    }
    const cleanLanguages = languages
      .map((l) => ({ language: l.language.trim(), level: l.level }))
      .filter((l) => l.language.length > 0)
    if (cleanLanguages.length === 0) {
      showStatus('At least one language, please.', false)
      return
    }

    const expIsNumber = /^\d+$/.test(expRaw)
    const payload = {
      name: trimmedName,
      gender,
      contact: { email: trimmedEmail, phone: trimmedPhone },
      department: trimmedDept,
      year,
      cgpa: cgpa.trim() ? parseFloat(cgpa) : null,
      hackathonExperience: expIsNumber ? Number(expRaw) : expRaw,
      expertise: expertise.trim(),
      languages: cleanLanguages,
      submittedAt: new Date().toISOString(),
    }

    setSending(true)
    showStatus('Writing to database…', true)
    try {
      const res = await fetch(`${DB_URL}/sih-team-selection.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`DB rejected the write (HTTP ${res.status}). Check Firebase rules.`)
      const data = await res.json()
      if (!data || !data.name) throw new Error('No confirmation ID returned — write may not have saved.')

      const verifyRes = await fetch(`${DB_URL}/sih-team-selection/${data.name}.json`)
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData) throw new Error('Write sent, but could not verify it landed in the database.')

      showStatus(`Record ID: ${data.name} — saved to the team selection database.`, true)
      onSuccess({ recordId: data.name, name: trimmedName })
    } catch (err) {
      showStatus('✕ NOT SAVED — ' + err.message, false)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="section">
          <div className="section-head">
            <div className="section-num">01</div>
            <div className="section-title">Identity</div>
            <div className="section-hint">Who&apos;s showing up</div>
          </div>
          <div className="grid">
            <div className="field">
              <label>Full Name<span className="req">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full Name" required />
            </div>
            <div className="field">
              <label>Gender<span className="req">*</span></label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                <option value="" disabled>Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
              <div className="req-note">We need exactly 1 girl + 1 boy for this slot.</div>
            </div>
            <div className="field">
              <label>Email<span className="req">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Phone Number<span className="req">*</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
            </div>
            <div className="field">
              <label>Department<span className="req">*</span></label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                <option value="" disabled>Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
                <option value="__other">Other — specify</option>
              </select>
              {department === '__other' && (
                <input
                  type="text"
                  value={departmentOther}
                  onChange={(e) => setDepartmentOther(e.target.value)}
                  placeholder="Type your department"
                  style={{ marginTop: 10 }}
                />
              )}
            </div>
            <div className="field">
              <label>Year of Study<span className="req">*</span></label>
              <select value={year} onChange={(e) => setYear(e.target.value)} required>
                <option value="" disabled>Select year</option>
                {YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>CGPA<span className="opt">(optional)</span></label>
              <input
                type="text"
                inputMode="decimal"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="e.g. 8.5"
              />
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-head">
            <div className="section-num">02</div>
            <div className="section-title">Experience</div>
            <div className="section-hint">What you&apos;ve done</div>
          </div>
          <div className="field">
            <label>Hackathons Attended<span className="req">*</span></label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} required>
              <option value="" disabled>Select count</option>
              <option value="0">0 — first timer</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="__other">Other — specify</option>
            </select>
            {experience === '__other' && (
              <input
                type="text"
                value={experienceOther}
                onChange={(e) => setExperienceOther(e.target.value)}
                placeholder="Enter your count or custom message"
                style={{ marginTop: 10 }}
              />
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-head">
            <div className="section-num">03</div>
            <div className="section-title">Expertise</div>
            <div className="section-hint">Where you actually contribute</div>
          </div>
          <label>Tell us what you bring — no modesty</label>
          <input
            type="text"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="e.g. Full-stack dev, worked on two hackathon projects"
            required
          />
          <div className="req-note">A few words or a full list — your call.</div>
        </div>

        <div className="section">
          <div className="section-head">
            <div className="section-num">04</div>
            <div className="section-title">Languages</div>
            <div className="section-hint">Spoken / written, with honest levels</div>
          </div>
          {languages.map((lang, idx) => (
            <div className="lang-row" key={idx}>
              <div className="field">
                <label>Language</label>
                <input
                  type="text"
                  className="lang-name"
                  value={lang.language}
                  onChange={(e) => updateLanguage(idx, 'language', e.target.value)}
                  placeholder="e.g. English"
                />
              </div>
              <div className="field">
                <label>Level</label>
                <select className="lang-level" value={lang.level} onChange={(e) => updateLanguage(idx, 'level', e.target.value)}>
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="rm-btn" onClick={() => removeLanguage(idx)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addLanguage}>+ ADD LANGUAGE</button>
        </div>

        <div className="footer-bar">
          <div className="id-preview">1 girl + 1 boy — <b>first come, first in</b></div>
          <button type="submit" className="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Submit Entry →'}
          </button>
        </div>
      </form>

      {status && <div className={'status ' + (status.ok ? 'ok' : 'err')}>{status.msg}</div>}

      <div className="whatsapp-banner">
        <p>
          <b>While you&apos;re here — join the team group.</b> The shortlist happens in WhatsApp, not the form.
          Get in now so you don&apos;t miss the final call.
        </p>
        <a className="wa-btn" href={WHATSAPP_GROUP} target="_blank" rel="noreferrer">Join WhatsApp Group →</a>
      </div>
      <div className="whatsapp-banner">
        <p>
          <b>Or reach an admin directly.</b> Ping us on WhatsApp and we&apos;ll sort it out immediately.
        </p>
        <a className="wa-btn" href="https://wa.me/918484880429" target="_blank" rel="noreferrer">Admin 1 — 8484880429 →</a>
        <a className="wa-btn" href="https://wa.me/918108109246" target="_blank" rel="noreferrer">Admin 2 — 8108109246 →</a>
      </div>
    </>
  )
}
