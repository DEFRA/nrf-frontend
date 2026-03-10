window.onload = function () {
  SwaggerUIBundle({
    url: '/swagger.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout',
    requestInterceptor: function (req) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', '/docs/csrf-token', false)
        xhr.send()
        if (xhr.status === 200) {
          var token = JSON.parse(xhr.responseText).csrfToken
          if (
            req.headers['Content-Type'] &&
            req.headers['Content-Type'].indexOf(
              'application/x-www-form-urlencoded'
            ) !== -1
          ) {
            req.body = req.body
              ? req.body + '&csrfToken=' + encodeURIComponent(token)
              : 'csrfToken=' + encodeURIComponent(token)
          } else {
            req.headers['x-csrf-token'] = token
          }
        }
      }
      return req
    }
  })
}
