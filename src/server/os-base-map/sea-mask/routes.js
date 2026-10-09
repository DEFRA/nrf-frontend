import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { getOrdnanceSurveyMapUrl } from '../ordnance-survey-url.js'
import {
  getCachedTile,
  setCachedTile
} from '../../common/services/tile-cache.js'
import { buildSeaMaskTile } from './build-sea-mask-tile.js'
import { isTileOutsideEngland } from './is-tile-outside-england.js'
import { tileParamsSchema } from './tile-params-validation.js'

const logger = createLogger()
const mvtContentType = 'application/vnd.mapbox-vector-tile'
const cacheControlHeader = 'cache-control'

export const seaMaskRoutePath = '/os-base-map/sea-mask'

// With no land to cut out, the mask is the whole tile.
const allSeaTile = buildSeaMaskTile(Buffer.alloc(0))

function tileCacheControl() {
  return `public, max-age=${config.get('map.tileCacheControlMaxAge')}, immutable`
}

/**
 * The mask is decoration over the aerial imagery, so an upstream failure must
 * leave the map looking as it did before the layer existed rather than
 * surfacing an error the user can do nothing about. It carries no cache header,
 * so the global default of no-store applies and a brief outage isn't kept in
 * browsers for the life of the tile cache.
 *
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {import('@hapi/hapi').ResponseObject}
 */
function emptyTile(h) {
  return h
    .response(Buffer.alloc(0))
    .code(statusCodes.noContent)
    .type(mvtContentType)
}

/**
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @param {Buffer} tile
 * @returns {import('@hapi/hapi').ResponseObject}
 */
function seaTile(h, tile) {
  return h
    .response(tile)
    .type(mvtContentType)
    .header(cacheControlHeader, tileCacheControl())
}

/**
 * @param {{ z: number, x: number, y: number }} params
 * @returns {Promise<Buffer|null>}
 */
async function fetchLandTile({ z, x, y }) {
  // Ordnance Survey orders the tile path row before column, the reverse of the
  // {z}/{x}/{y} MapLibre requests.
  const url = getOrdnanceSurveyMapUrl({ path: `tile/${z}/${y}/${x}.pbf` })
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(config.get('map.seaMaskUpstreamTimeoutMs'))
  })

  if (!response.ok) {
    logger.warn(
      { z, x, y, status: response.status },
      'Sea mask upstream tile request failed'
    )
    return null
  }

  return Buffer.from(await response.arrayBuffer())
}

/**
 * Clipping detailed coastline is CPU heavy, so built tiles are kept in Redis.
 * Only for a short time: the mask is derived from Ordnance Survey data, which
 * may be cached temporarily for performance but never stored permanently.
 *
 * @param {{ z: number, x: number, y: number }} tile
 * @returns {Promise<Buffer|null>} null when Ordnance Survey has no tile for us
 */
async function getSeaMaskTile({ z, x, y }) {
  const cacheKey = `sea-mask/${z}/${x}/${y}`
  const cached = await getCachedTile(cacheKey)
  if (cached) {
    return cached
  }

  const landTile = await fetchLandTile({ z, x, y })
  if (landTile === null) {
    return null
  }

  const seaMaskTile = buildSeaMaskTile(landTile)
  await setCachedTile(cacheKey, seaMaskTile, {
    ttlSeconds: config.get('map.seaMaskRedisCacheTtlSeconds')
  })
  return seaMaskTile
}

const seaMaskHandler = {
  method: 'GET',
  path: `${seaMaskRoutePath}/{z}/{x}/{y}.pbf`,
  options: {
    auth: false,
    validate: {
      params: tileParamsSchema
    }
  },
  async handler(request, h) {
    const { z, x, y } = request.params

    if (isTileOutsideEngland({ z, x, y })) {
      return seaTile(h, allSeaTile)
    }

    try {
      const seaMaskTile = await getSeaMaskTile({ z, x, y })
      return seaMaskTile === null ? emptyTile(h) : seaTile(h, seaMaskTile)
    } catch (err) {
      logger.error(err, `Sea mask tile failed for ${z}/${x}/${y}`)
      return emptyTile(h)
    }
  }
}

export default [seaMaskHandler]
