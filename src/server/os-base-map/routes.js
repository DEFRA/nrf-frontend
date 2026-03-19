import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'

const logger = createLogger()

const ordnanceSurveyMapUrl = 'https://api.os.uk/maps/vector/v1/vts'

export const routePath = '/os-base-map'

function getOrdnanceSurveyMapUrl(path, query) {
  const ordnanceSurveyApiKey = config.get('map.osApiKey')
  const params = new URLSearchParams(query)
  params.set('key', ordnanceSurveyApiKey)
  params.set('srs', '3857')
  const base = path ? `${ordnanceSurveyMapUrl}/${path}` : ordnanceSurveyMapUrl
  return `${base}?${params.toString()}`
}

// Rewrites api.os.uk URLs in JSON responses to route through our proxy, stripping
// query strings so the API key isn't leaked to the client.
function rewriteOrdnanceSurveyMapUrls(body, host) {
  const proxyBase = `${host}${routePath}`

  let json
  try {
    json = JSON.parse(body)
  } catch {
    return body
  }

  const rewrite = (v) => {
    if (typeof v === 'string') {
      if (!v.startsWith(ordnanceSurveyMapUrl)) return v

      const rest = v.slice(ordnanceSurveyMapUrl.length)
      const i = rest.indexOf('?')
      return proxyBase + (i === -1 ? rest : rest.slice(0, i))
    }

    if (Array.isArray(v)) return v.map(rewrite)

    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v).map(([k, val]) => [k, rewrite(val)])
      )
    }

    return v
  }

  return JSON.stringify(rewrite(json))
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
    const ordnanceSurveyUrl = getOrdnanceSurveyMapUrl(path, request.query)

    try {
      // For binary resources (tiles, sprites), don't decompress — pass through raw
      const binary = isBinaryPath(path)
      const { res, payload } = await Wreck.get(ordnanceSurveyUrl, {
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

      // JSON responses — rewrite Ordnance Survey URLs to point to our proxy
      const protocol =
        request.headers['x-forwarded-proto'] || request.server.info.protocol
      const host = `${protocol}://${request.info.host}`
      const rewritten = rewriteOrdnanceSurveyMapUrls(payload.toString(), host)
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
