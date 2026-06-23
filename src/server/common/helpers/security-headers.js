/**
 * Apply additional security headers not covered by routes.security or Blankie.
 * Must run after catchAll so headers are set on the final view response.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
function applySecurityHeaders(request, h) {
  const { response } = request
  const headers =
    'isBoom' in response ? response.output.headers : response.headers

  headers['Permissions-Policy'] =
    'camera=(), microphone=(), geolocation=(), payment=()'
  headers['Cross-Origin-Opener-Policy'] = 'same-origin'
  headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
  headers['Cross-Origin-Resource-Policy'] = 'same-origin'
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

  return h.continue
}

/**
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const securityHeaders = {
  plugin: {
    name: 'security-headers',
    register(server) {
      server.ext('onPreResponse', applySecurityHeaders)
    }
  }
}

export { securityHeaders, applySecurityHeaders }
