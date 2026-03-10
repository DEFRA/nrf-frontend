import path from 'node:path'
import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NRF Frontend',
      version: '1.0.0',
      description: 'Natural Resources Frontend application routes'
    }
  },
  apis: [
    'src/server/health/index.js',
    'src/server/about/index.js',
    'src/server/auth/index.js',
    'src/server/profile/index.js',
    'src/server/quote/index.js',
    'src/server/quote/*/routes.js'
  ]
}

const swaggerSpec = swaggerJsdoc(options)

const swaggerCsp =
  "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; font-src 'self' data:"

function relaxCsp(request, h) {
  if (request.path === '/docs' || request.path.startsWith('/swagger-ui')) {
    const { response } = request
    if (response.isBoom) {
      return h.continue
    }

    response.header('Content-Security-Policy', swaggerCsp)
  }
  return h.continue
}

function specRoute() {
  return {
    method: 'GET',
    path: '/swagger.json',
    handler: (_request, h) => h.response(swaggerSpec).type('application/json'),
    options: { auth: false }
  }
}

function docsRoute() {
  return {
    method: 'GET',
    path: '/docs',
    handler: (_request, h) => {
      return h
        .response(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Documentation - NRF Frontend</title>
  <link rel="stylesheet" href="/swagger-ui/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/swagger-ui/swagger-ui-bundle.js"></script>
  <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
  <script src="/swagger-ui/swagger-initializer.js"></script>
</body>
</html>`
        )
        .type('text/html')
    },
    options: { auth: false }
  }
}

function csrfTokenRoute() {
  return {
    method: 'GET',
    path: '/docs/csrf-token',
    handler(request, h) {
      return h
        .response({ csrfToken: request.plugins.crumb })
        .type('application/json')
    },
    options: { auth: false }
  }
}

function initializerRoute() {
  return {
    method: 'GET',
    path: '/swagger-ui/swagger-initializer.js',
    handler: (_request, h) => {
      return h
        .response(
          `window.onload = function () {
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
          if (req.headers['Content-Type'] && req.headers['Content-Type'].indexOf('application/x-www-form-urlencoded') !== -1) {
            req.body = req.body ? req.body + '&csrfToken=' + encodeURIComponent(token) : 'csrfToken=' + encodeURIComponent(token)
          } else {
            req.headers['x-csrf-token'] = token
          }
        }
      }
      return req
    }
  })
}`
        )
        .type('application/javascript')
    },
    options: { auth: false }
  }
}

function staticAssetsRoute() {
  return {
    method: 'GET',
    path: '/swagger-ui/{param*}',
    handler: {
      directory: {
        path: path.resolve('node_modules/swagger-ui-dist'),
        listing: false
      }
    },
    options: { auth: false }
  }
}

export const swagger = {
  plugin: {
    name: 'swagger',
    register(server) {
      server.ext('onPreResponse', relaxCsp)
      server.route([
        specRoute(),
        docsRoute(),
        csrfTokenRoute(),
        initializerRoute(),
        staticAssetsRoute()
      ])
    }
  }
}
