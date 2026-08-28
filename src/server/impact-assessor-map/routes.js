import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getMapTile } from '../common/services/ia-map-tile-server.js'
import {
  getCachedTile,
  isAerialTilePath,
  isCacheableTilePath,
  setCachedTile
} from '../common/services/tile-cache.js'

const logger = createLogger()
const defaultCacheControl = 'no-cache'
const cacheControlHeader = 'cache-control'
const mvtContentType = 'application/vnd.mapbox-vector-tile'
const pngContentType = 'image/png'
const jpegContentType = 'image/jpeg'
// PNG file signature: \x89 P N G
const pngMagic = Buffer.from('89504e47', 'hex')
const aerialOutcomeHeader = 'x-aerial-proxy-tile'
const aerialHitOutcome = 'hit'

export const routePath = '/impact-assessor-map'

function getResponseHeaders(res) {
  return {
    contentType: res.headers.get('content-type') || '',
    cacheControl: res.headers.get(cacheControlHeader) || defaultCacheControl
  }
}

function tileCacheControl() {
  return `public, max-age=${config.get('map.tileCacheControlMaxAge')}, immutable`
}

// APGB imagery is licensed, so it must not be widened to shared caches.
function aerialCacheControl() {
  return `private, max-age=${config.get('map.tileCacheControlMaxAge')}`
}

// Aerial tiles are image/jpeg or image/png; sniffing the bytes avoids storing
// a content type alongside every one.
function imageContentType(payload) {
  return payload.subarray(0, pngMagic.length).equals(pngMagic)
    ? pngContentType
    : jpegContentType
}

function isAerialHit(response) {
  return response.headers.get(aerialOutcomeHeader) === aerialHitOutcome
}

function serveCachedTile(h, payload, aerial) {
  return h
    .response(payload)
    .type(aerial ? imageContentType(payload) : mvtContentType)
    .header(
      cacheControlHeader,
      aerial ? aerialCacheControl() : tileCacheControl()
    )
}

const proxyHandler = {
  method: 'GET',
  path: `${routePath}/{path*}`,
  options: {
    auth: false
  },
  async handler(request, h) {
    const path = request.params.path || ''
    const cacheable = isCacheableTilePath(path)
    const aerial = isAerialTilePath(path)

    try {
      if (cacheable) {
        const cached = await getCachedTile(path)
        if (cached) {
          logger.info({ path }, 'Impact assessor tile cache read')
          return serveCachedTile(h, cached, aerial)
        }
      }

      const response = await getMapTile(path, request)

      if (!response.ok) {
        const body = Buffer.from(await response.arrayBuffer())
        return h.response(body).code(response.status)
      }

      const payload = Buffer.from(await response.arrayBuffer())

      // The "no imagery available" placeholder is a 200, so caching it would
      // pin it over a region for the whole TTL.
      if (cacheable && (!aerial || isAerialHit(response))) {
        await setCachedTile(path, payload)
        logger.info({ path }, 'Impact assessor tile cache write')
        return serveCachedTile(h, payload, aerial)
      }

      const { contentType, cacheControl } = getResponseHeaders(response)
      return h
        .response(payload)
        .type(contentType)
        .header(cacheControlHeader, cacheControl)
    } catch (err) {
      logger.error(err, `Impact assessor proxy error for ${path || '/'}`)
      return h
        .response('Impact assessor tile request failed')
        .code(statusCodes.badGateway)
    }
  }
}

export default [proxyHandler]
