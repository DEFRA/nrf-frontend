const ENDPOINT = '/api/browser-logs'

function send(payload) {
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {
    // Swallow fetch errors to avoid infinite logging loops
  })
}

function buildBase(level, message) {
  return {
    level,
    message,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }
}

export const logger = {
  /**
   * @param {Object} meta - Event metadata (e.g. { action: 'map-load', ... })
   * @param {string} message
   */
  info(meta, message) {
    send({ ...buildBase('info', message), action: 'info', ...meta })
  },

  /**
   * @param {Error} error
   * @param {string} message
   */
  error(error, message) {
    send({
      ...buildBase('error', message),
      action: 'error',
      stack: error?.stack,
      errorType: error?.name
    })
  }
}
