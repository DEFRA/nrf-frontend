/* global SwaggerUIBundle, SwaggerUIStandalonePreset */
function csrfInterceptor(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/docs/csrf-token', false)
    xhr.send()
    const HTTP_OK = 200
    if (xhr.status === HTTP_OK) {
      const token = JSON.parse(xhr.responseText).csrfToken
      if (
        req.headers['Content-Type']?.includes(
          'application/x-www-form-urlencoded'
        )
      ) {
        const encodedToken = encodeURIComponent(token)
        req.body = req.body
          ? `${req.body}&csrfToken=${encodedToken}`
          : `csrfToken=${encodedToken}`
      } else {
        req.headers['x-csrf-token'] = token
      }
    }
  }
  return req
}

window.onload = function () {
  SwaggerUIBundle({
    url: '/swagger.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout',
    requestInterceptor: csrfInterceptor
  })
}
