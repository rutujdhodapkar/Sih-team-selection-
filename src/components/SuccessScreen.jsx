import React from 'react'

const WHATSAPP_GROUP = 'https://chat.whatsapp.com/Ljh9PDnfrDe8jYpJ8YKj26?s=sh&p=a&mlu=4'

const ADMINS = [
  { label: 'Admin 1', phone: '8484880429', wa: 'https://wa.me/918484880429?text=Hi%20admin%2C%20I%20just%20registered%20for%20the%20SIH%20team.' },
  { label: 'Admin 2', phone: '8108109246', wa: 'https://wa.me/918108109246?text=Hi%20admin%2C%20I%20just%20registered%20for%20the%20SIH%20team.' },
]

export default function SuccessScreen({ result, onRestart }) {
  return (
    <div className="success">
      <div className="tick">✓</div>
      <h2>Submission done — you&apos;re in the running.</h2>
      <p>
        Your entry for <b style={{ color: 'var(--ink)' }}>{result.name}</b> was saved to the team selection database.
        Next step: join the group so the admins can reach you the moment the team is locked.
      </p>
      <span className="rid">Record ID: {result.recordId}</span>

      <div className="success-actions">
        <a className="wa-btn" href={WHATSAPP_GROUP} target="_blank" rel="noreferrer">Join WhatsApp Group →</a>
        {ADMINS.map((a) => (
          <a className="btn-ghost" key={a.phone} href={a.wa} target="_blank" rel="noreferrer">
            {a.label} ({a.phone}) →
          </a>
        ))}
        <button className="btn-ghost" onClick={onRestart}>Submit another entry</button>
      </div>
    </div>
  )
}
