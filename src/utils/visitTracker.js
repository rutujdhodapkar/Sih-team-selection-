const DB_URL = 'https://open-message-994d9-default-rtdb.europe-west1.firebasedatabase.app'

const VISITOR_ID_KEY = 'sih_visitor_id'
const VISITOR_UNIQUE_RECORDED_KEY = 'sih_unique_visitor_recorded'
const VISITOR_HISTORY_KEY = 'sih_visit_history'
let trackingStarted = false

const safeJsonParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

const makeVisitorId = () => {
  const raw = [
    navigator.userAgent || '',
    navigator.language || '',
    navigator.platform || '',
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen.width || '',
    screen.height || '',
    screen.colorDepth || '',
  ].join('|')
  return btoa(unescape(encodeURIComponent(raw))).replace(/=+$/g, '').slice(0, 64)
}

const getVisitorId = () => {
  const existing = localStorage.getItem(VISITOR_ID_KEY)
  if (existing) return existing
  const next = makeVisitorId()
  localStorage.setItem(VISITOR_ID_KEY, next)
  return next
}

const appendLocalVisitHistory = (visitRecord) => {
  const previous = safeJsonParse(localStorage.getItem(VISITOR_HISTORY_KEY), [])
  const next = Array.isArray(previous) ? previous : []
  next.push(visitRecord)
  localStorage.setItem(VISITOR_HISTORY_KEY, JSON.stringify(next.slice(-100)))
}

const getBrowserData = () => ({
  userAgent: navigator.userAgent || '',
  language: navigator.language || '',
  platform: navigator.platform || '',
  cookieEnabled: !!navigator.cookieEnabled,
  hardwareConcurrency: navigator.hardwareConcurrency ?? null,
  screen: `${screen.width}x${screen.height}`,
  colorDepth: screen.colorDepth ?? null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  localTime: new Date().toString(),
})

const getIpData = async () => {
  try {
    const res = await fetch('https://ipwho.is/', { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok || data?.success === false) throw new Error('ipwho.is failed')
    return {
      ip: data.ip || null,
      location: {
        city: data.city || null,
        region: data.region || null,
        country: data.country || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
      network: {
        isp: data.connection?.isp || null,
        org: data.connection?.org || null,
        asn: data.connection?.asn || null,
      },
      security: {
        vpn: data.security?.vpn ?? null,
        proxy: data.security?.proxy ?? null,
        tor: data.security?.tor ?? null,
      },
    }
  } catch {
    try {
      const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' })
      const data = await res.json()
      return {
        ip: data.ip || null,
        location: null,
        network: null,
        security: { vpn: null, proxy: null, tor: null },
      }
    } catch {
      return {
        ip: null,
        location: null,
        network: null,
        security: { vpn: null, proxy: null, tor: null },
      }
    }
  }
}

const writeVisit = async (visitorId, payload) => {
  const existingVisitorRes = await fetch(`${DB_URL}/visitor-analytics/visitors/${visitorId}.json`)
  const existingVisitor = existingVisitorRes.ok ? await existingVisitorRes.json() : null
  const isFirstSeen = !existingVisitor

  const visitorUpdate = {
    visitorId,
    firstSeenAt: existingVisitor?.firstSeenAt || payload.visitedAt,
    lastSeenAt: payload.visitedAt,
    ip: payload.ipData.ip || existingVisitor?.ip || null,
    browser: payload.browserData.userAgent,
    timezone: payload.browserData.timezone,
    visitCount: (existingVisitor?.visitCount || 0) + 1,
  }

  await fetch(`${DB_URL}/visitor-analytics/visitors/${visitorId}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitorUpdate),
  })

  await fetch(`${DB_URL}/visitor-analytics/visits.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const hourKey = new Date(payload.visitedAt).toISOString().slice(0, 13)
  const hourRes = await fetch(`${DB_URL}/visitor-analytics/hourly/${hourKey}.json`)
  const hourCount = hourRes.ok ? await hourRes.json() : 0
  await fetch(`${DB_URL}/visitor-analytics/hourly/${hourKey}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify((Number(hourCount) || 0) + 1),
  })

  const totalRes = await fetch(`${DB_URL}/visitor-analytics/summary/totalVisits.json`)
  const totalCount = totalRes.ok ? await totalRes.json() : 0
  await fetch(`${DB_URL}/visitor-analytics/summary/totalVisits.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify((Number(totalCount) || 0) + 1),
  })

  if (isFirstSeen) {
    const uniqueRes = await fetch(`${DB_URL}/visitor-analytics/summary/uniqueVisitors.json`)
    const uniqueCount = uniqueRes.ok ? await uniqueRes.json() : 0
    await fetch(`${DB_URL}/visitor-analytics/summary/uniqueVisitors.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify((Number(uniqueCount) || 0) + 1),
    })
    localStorage.setItem(VISITOR_UNIQUE_RECORDED_KEY, 'true')
  }
}

export const trackVisit = async () => {
  if (trackingStarted) return
  trackingStarted = true

  try {
    const visitorId = getVisitorId()
    const browserData = getBrowserData()
    const ipData = await getIpData()
    const visitedAt = new Date().toISOString()

    const payload = {
      visitorId,
      visitedAt,
      browserData,
      ipData,
      vpnStatus:
        ipData?.security?.vpn === true
          ? 'on'
          : ipData?.security?.vpn === false
            ? 'off'
            : 'unknown',
    }

    appendLocalVisitHistory({
      visitedAt,
      ip: ipData.ip,
      location: ipData.location,
      vpnStatus: payload.vpnStatus,
    })

    await writeVisit(visitorId, payload)

    if (!localStorage.getItem(VISITOR_UNIQUE_RECORDED_KEY)) {
      localStorage.setItem(VISITOR_UNIQUE_RECORDED_KEY, 'true')
    }
  } catch {
    // Swallow analytics errors so form flow is never blocked.
  }
}
