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
  const basePath = new URL(ordnanceSurveyMapUrl).pathname

  try {
    // Walk every value in the JSON using the parse reviver callback
    const json = JSON.parse(body, (_key, value) => {
      if (typeof value === 'string' && value.startsWith(ordnanceSurveyMapUrl)) {
        // Extract the sub-path (e.g. /resources/styles) and discard the query string.
        // decodeURIComponent restores MapLibre template tokens like {z}/{y}/{x}
        // that new URL() percent-encodes.
        const subPath = decodeURIComponent(
          new URL(value).pathname.slice(basePath.length)
        )
        return proxyBase + subPath
      }
      return value
    })

    return JSON.stringify(json)
  } catch {
    return body
  }
}

// Binary resources (vector tiles, sprite images) are passed through without parsing.
// Only JSON responses (style definitions, metadata) go through URL rewriting.
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
      const isBinaryResource = isBinaryPath(path)
      const logLevel = isBinaryResource ? 'debug' : 'info'

      // Using fetch (backed by Undici) so requests route through the CDP
      // HTTP_PROXY configured in setup-proxy.js via setGlobalDispatcher.
      // Note: fetch auto-decompresses responses, so for binary resources the
      // raw gzip bytes are not preserved. The overhead is minimal since tiles
      // are small (~20-80KB).
      logger[logLevel](
        `Map proxy ${isBinaryResource ? 'binary' : 'json'} request: ${path || '/'}`
      )
      const startTime = Date.now()
      const res = await fetch(ordnanceSurveyUrl, { redirect: 'follow' })
      const duration = Date.now() - startTime

      if (!res.ok) {
        logger.warn(
          `Map proxy upstream error: ${path || '/'} returned ${res.status} (${duration}ms)`
        )
        const body = Buffer.from(await res.arrayBuffer())
        return h.response(body).code(res.status)
      }

      const contentType = res.headers.get('content-type') || ''
      const cacheControl = res.headers.get('cache-control') || 'no-cache'

      // For binary resources (tiles, sprites), pass through the decompressed bytes.
      // fetch auto-decompresses so content-encoding is not forwarded.
      if (isBinaryResource) {
        const payload = Buffer.from(await res.arrayBuffer())
        logger.debug(
          `Map proxy binary response: ${path} ${res.status} ${payload.length} bytes (${duration}ms)`
        )
        return h
          .response(payload)
          .type(contentType)
          .header('cache-control', cacheControl)
      }

      // JSON responses (style definitions, TileJSON metadata) — rewrite Ordnance Survey
      // URLs to point to our proxy. Only a handful of these are fetched per map session;
      // the high-volume vector tile requests (.pbf) are binary and therefore returned raw above.
      const body = await res.text()
      logger.info(
        `Map proxy json response: ${path || '/'} ${res.status} ${body.length} chars (${duration}ms)`
      )
      const protocol =
        request.headers['x-forwarded-proto'] || request.server.info.protocol
      const host = `${protocol}://${request.info.host}`
      const rewritten = rewriteOrdnanceSurveyMapUrls(body, host)
      return h
        .response(rewritten)
        .type(contentType)
        .header('cache-control', cacheControl)
    } catch (err) {
      logger.error(
        `Map proxy error for ${path || '/'}: ${err.message} (${err.code || 'no error code'})`
      )
      return h.response('Map tile request failed').code(statusCodes.badGateway)
    }
  }
}

export default [proxyHandler]
