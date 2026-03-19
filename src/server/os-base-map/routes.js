import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'

const logger = createLogger()

const osBaseUrl = 'https://api.os.uk/maps/vector/v1/vts'

export const routePath = '/os-base-map'

function getOsUrl(path, query) {
  const osApiKey = config.get('map.osApiKey')
  const params = new URLSearchParams(query)
  params.set('key', osApiKey)
  params.set('srs', '3857')
  const base = path ? `${osBaseUrl}/${path}` : osBaseUrl
  return `${base}?${params.toString()}`
}

// OS API JSON responses (e.g. style docs, tile metadata) contain absolute URLs
// back to api.os.uk. We rewrite these to route through our proxy, which injects
// the API key server-side and strips the original query strings (including the
// API key) so they aren't leaked to the client.
function rewriteOsUrls(body, host) {
  const proxyBase = `${host}${routePath}`

  const json = JSON.parse(body)

  const rewriteValue = (value) => {
    if (typeof value === 'string' && value.startsWith(osBaseUrl)) {
      const rest = value.slice(osBaseUrl.length)
      // Strip query string (contains API key) but keep the sub-path.
      // Can't use new URL() here as it would encode MapLibre template
      // tokens like {z}/{y}/{x}.
      const subPath = rest.split('?')[0]
      return `${proxyBase}${subPath}`
    }
    if (Array.isArray(value)) return value.map(rewriteValue)
    if (value && typeof value === 'object') return rewriteKeys(value)
    return value
  }

  const rewriteKeys = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, rewriteValue(v)])
    )

  return JSON.stringify(rewriteKeys(json))
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
      const protocol =
        request.headers['x-forwarded-proto'] || request.server.info.protocol
      const host = `${protocol}://${request.info.host}`
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
      return h.response('Map tile request failed').code(statusCodes.badGateway)
    }
  }
}

export default [proxyHandler]
