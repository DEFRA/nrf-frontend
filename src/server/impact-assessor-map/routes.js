import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getMapTile } from '../common/services/ia-map-tile-server.js'
import {
  getCachedTile,
  isCacheableTilePath,
  setCachedTile
} from '../common/services/tile-cache.js'

const logger = createLogger()
const defaultCacheControl = 'no-cache'
const cacheControlHeader = 'cache-control'
const mvtContentType = 'application/vnd.mapbox-vector-tile'

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

function isTileCachingEnabled(path) {
  return config.get('map.tileCacheEnabled') && isCacheableTilePath(path)
}

const proxyHandler = {
  method: 'GET',
  path: `${routePath}/{path*}`,
  options: {
    auth: false
  },
  async handler(request, h) {
    const path = request.params.path || ''
    const cacheable = isTileCachingEnabled(path)

    try {
      if (cacheable) {
        const cached = await getCachedTile(path)
        if (cached) {
          return h
            .response(cached)
            .type(mvtContentType)
            .header(cacheControlHeader, tileCacheControl())
        }
      }

      const response = await getMapTile(path, request)

      if (!response.ok) {
        const body = Buffer.from(await response.arrayBuffer())
        return h.response(body).code(response.status)
      }

      const payload = Buffer.from(await response.arrayBuffer())

      if (cacheable) {
        await setCachedTile(path, payload)
        return h
          .response(payload)
          .type(mvtContentType)
          .header(cacheControlHeader, tileCacheControl())
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
