let cachedIp = null

async function getIpAddress() {
  if (cachedIp) return cachedIp
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    if (res.ok) {
      const data = await res.json()
      cachedIp = data.ip
      return cachedIp
    }
  } catch {
    // Graceful fallback
  }
  return 'unknown'
}

export async function logVisit(action, score) {
  const url = import.meta.env.VITE_ANALYTICS_URL
  
  if (!url) {
    if (import.meta.env.DEV) {
      console.log('[Analytics Dry Run]', {
        action,
        score,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'none',
        timestamp: new Date().toISOString(),
      })
    }
    return
  }

  try {
    const ip = await getIpAddress()
    const payload = {
      ip,
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'none',
      action,
      score,
      timestamp: Date.now(),
    }

    // We use mode: 'no-cors' since Google Apps Script redirects do not return CORS headers,
    // which normally causes standard fetch requests to fail with a browser network error.
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {})
  } catch {
    // Silence errors to prevent breaking app behavior
  }
}
