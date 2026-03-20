import Wreck from '@hapi/wreck'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'

const logger = createLogger()

const ordnanceSurveyMapUrl = 'https://api.os.uk/maps/vector/v1/vts'

function getProxyAgent() {
  const proxyUrl = config.get('httpProxy') ?? config.get('httpsProxy')
  if (proxyUrl) {
    return new HttpsProxyAgent(proxyUrl)
  }
  return undefined
}

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
      const { res, payload } = await Wreck.get(ordnanceSurveyUrl, {
        redirects: 3,
        maxBytes: 10 * 1024 * 1024,
        gunzip: !isBinaryResource,
        agent: getProxyAgent()
      })

      const contentType = res.headers['content-type'] || ''
      const cacheControl = res.headers['cache-control'] || 'no-cache'

      // For binary resources (tiles, sprites), don't decompress — pass through raw
      if (isBinaryResource) {
        const response = h
          .response(payload)
          .type(contentType)
          .header('cache-control', cacheControl)

        if (res.headers['content-encoding']) {
          response.header('content-encoding', res.headers['content-encoding'])
        }

        return response
      }

      // JSON responses (style definitions, TileJSON metadata) — rewrite Ordnance Survey
      // URLs to point to our proxy. Only a handful of these are fetched per map session;
      // the high-volume vector tile requests (.pbf) are binary and therefore returned raw above.
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
