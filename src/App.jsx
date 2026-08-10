import React, { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import RegistrationForm from './components/RegistrationForm.jsx'
import SuccessScreen from './components/SuccessScreen.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  const [time, setTime] = useState('00:00:00')
  const [submitted, setSubmitted] = useState(null)

  useEffect(() => {
    const tick = () => setTime(new Date().toTimeString().slice(0, 8))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <div className="scan"></div>
      <div className="wrap">
        <div className="topline">
          <span>SMART INDIA HACKATHON <span className="blink">●</span> TEAM-BUILD 2026</span>
          <span style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <span>{time}</span>
            <Link className="admin-link" to="/admin">ADMIN</Link>
          </span>
        </div>

        <Routes>
          <Route
            path="/admin"
            element={<AdminPanel />}
          />
          <Route
            path="*"
            element={
              <>
                <header className="hero">
                  <span className="eyebrow">Join SIH Team // Recruiting</span>
                  <h1>Join the <span>SIH</span> team with experienced members.</h1>
                  <p className="sub">
                    We are putting together a strong SIH squad. Looking for <b style={{ color: 'var(--ink)' }}>one girl</b> and{' '}
                    <b style={{ color: 'var(--ink)' }}>one boy</b> to round out the team. Fill the form, join the group, and
                    let&apos;s ship something real.
                  </p>
                  <div className="badge-row">
                    <div className="badge">STATUS <b>RECRUITING</b></div>
                    <div className="badge hot">NEED <b>1 GIRL + 1 BOY</b></div>
                    <div className="badge">TIME <b>~2 MIN</b></div>
                  </div>
                </header>

                <section className="about">
                  <div className="about-head">
                    <div className="section-num">i!</div>
                    <div className="section-title">About Team Tech Apes — SIH Selections</div>
                  </div>
                  <p className="about-text">
                    Team Tech Apes is conducting selections for <b style={{ color: 'var(--ink)' }}>2 positions</b> in our SIH team.
                    We are looking for students who are enthusiastic about participation, proficient in{' '}
                    <b style={{ color: 'var(--ink)' }}>Frontend Development</b> or <b style={{ color: 'var(--ink)' }}>UI/UX Design</b>,
                    and possess strong <b style={{ color: 'var(--ink)' }}>communication and presentation</b> abilities.
                  </p>
                </section>

                {submitted ? (
                  <SuccessScreen result={submitted} onRestart={() => setSubmitted(null)} />
                ) : (
                  <RegistrationForm onSuccess={setSubmitted} />
                )}
              </>
            }
          />
        </Routes>
      </div>
    </>
  )
}
