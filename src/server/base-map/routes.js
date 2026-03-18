import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

const osBaseUrl = 'https://api.os.uk/maps/vector/v1/vts'

export const routePath = '/base-map'

function getOsUrl(path, query) {
  const osApiKey = config.get('map.osApiKey')
  const params = new URLSearchParams(query)
  params.set('key', osApiKey)
  params.set('srs', '3857')
  const base = path ? `${osBaseUrl}/${path}` : osBaseUrl
  return `${base}?${params.toString()}`
}

function rewriteOsUrls(body, host) {
  const escapedBase = osBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = `${escapedBase}(?:/(.*?))?\\?[^"\\s]*`
  return body.replace(
    new RegExp(pattern, 'g'),
    (_, path) => `${host}${routePath}${path ? `/${path}` : ''}`
  )
}

function isBinaryPath(path) {
  return path.endsWith('.pbf') || path.endsWith('.png') || path.endsWith('.jpg')
}

const proxyHandler = {
  method: 'GET',
  path: `${routePath}/{path*}`,
  options: {
    auth: false
  },
  async handler(request, h) {
    const path = request.params.path || ''
    const osUrl = getOsUrl(path, request.query)

    try {
      // For binary resources (tiles, sprites), don't decompress — pass through raw
      const binary = isBinaryPath(path)
      const { res, payload } = await Wreck.get(osUrl, {
        redirects: 3,
        maxBytes: 10 * 1024 * 1024,
        gunzip: !binary
      })

      const contentType = res.headers['content-type'] || ''
      const cacheControl = res.headers['cache-control'] || 'no-cache'

      if (binary) {
        const response = h
          .response(payload)
          .type(contentType)
          .header('cache-control', cacheControl)

        if (res.headers['content-encoding']) {
          response.header('content-encoding', res.headers['content-encoding'])
        }

        return response
      }

      // JSON responses — rewrite OS URLs to point to our proxy
      const host = `${request.headers['x-forwarded-proto'] || request.server.info.protocol}://${request.info.host}`
      const rewritten = rewriteOsUrls(payload.toString(), host)
      return h
        .response(rewritten)
        .type(contentType)
        .header('cache-control', cacheControl)
    } catch (err) {
      // Wreck throws a Boom error on non-2xx responses (e.g. 403 for tiles outside UK coverage)
      if (err.data?.isResponseError) {
        const statusCode = err.data.res.statusCode
        return h.response(err.data.payload).code(statusCode)
      }

      logger.error(`Map proxy error for ${path}: ${err.message}`)
      return h.response('Map tile request failed').code(502)
    }
  }
}

export default [proxyHandler]
