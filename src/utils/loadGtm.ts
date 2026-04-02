const GTM_SCRIPT_ID = 'gtm-script'

/** Programmatically injects Google Tag Manager if not already present. */
export const loadGtm = (gtmId: string): void => {
  if (typeof window === 'undefined') return
  if (document.getElementById(GTM_SCRIPT_ID)) return

  // Initialise the dataLayer
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })

  // Inject the GTM script into <head>
  const script = document.createElement('script')
  script.id = GTM_SCRIPT_ID
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
  document.head.appendChild(script)

  // Inject the <noscript> iframe into <body>
  const noscript = document.createElement('noscript')
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`
  iframe.height = '0'
  iframe.width = '0'
  iframe.style.display = 'none'
  iframe.style.visibility = 'hidden'
  noscript.appendChild(iframe)
  document.body.appendChild(noscript)
}

// Extend Window for dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}
