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
    cacheControl: res.headers.get(cacheControlHeader) || defaultCacheControl,
    aerialOutcome: res.headers.get(aerialOutcomeHeader)
  }
}

function tileCacheControl() {
  return `public, max-age=${config.get('map.tileCacheControlMaxAge')}, immutable`
}

// APGB imagery is licensed, so it must not be widened to shared caches.
function aerialCacheControl() {
  return `private, max-age=${config.get('map.aerialTileCacheControlMaxAge')}`
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

async function serveFromCache(h, path, aerial) {
  const cached = await getCachedTile(path)
  if (!cached) {
    return null
  }

  logger.info({ path }, 'Impact assessor tile cache read')
  return serveCachedTile(h, cached, aerial)
}

// The "no imagery available" placeholder is a 200, so caching it would pin it
// over a region for the whole TTL.
function isStorable(cacheable, aerial, response) {
  return cacheable && (!aerial || isAerialHit(response))
}

async function storeAndServe(h, path, payload, aerial) {
  await setCachedTile(path, payload)
  logger.info({ path }, 'Impact assessor tile cache write')
  return serveCachedTile(h, payload, aerial)
}

function proxyTile(h, payload, response, aerial) {
  const { contentType, cacheControl, aerialOutcome } =
    getResponseHeaders(response)
  // Real imagery is browser-cached for the full aerial max-age even when it is
  // too deep to keep in Redis. Placeholders keep the impact assessor's short
  // TTL so a broken region isn't pinned in the browser.
  const aerialHit = aerial && isAerialHit(response)
  const proxied = h
    .response(payload)
    .type(contentType)
    .header(cacheControlHeader, aerialHit ? aerialCacheControl() : cacheControl)

  // The IA answers every aerial failure with a 200 placeholder, so without this
  // header a broken layer is indistinguishable from a working one.
  return aerialOutcome
    ? proxied.header(aerialOutcomeHeader, aerialOutcome)
    : proxied
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
        const cacheHit = await serveFromCache(h, path, aerial)
        if (cacheHit) {
          return cacheHit
        }
      }

      const response = await getMapTile(path, request)
      const payload = Buffer.from(await response.arrayBuffer())

      if (!response.ok) {
        return h.response(payload).code(response.status)
      }

      return isStorable(cacheable, aerial, response)
        ? await storeAndServe(h, path, payload, aerial)
        : proxyTile(h, payload, response, aerial)
    } catch (err) {
      logger.error(err, `Impact assessor proxy error for ${path || '/'}`)
      return h
        .response('Impact assessor tile request failed')
        .code(statusCodes.badGateway)
    }
  }
}

export default [proxyHandler]
