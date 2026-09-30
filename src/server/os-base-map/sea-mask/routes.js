import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { getOrdnanceSurveyMapUrl } from '../ordnance-survey-url.js'
import { buildSeaMaskTile } from './build-sea-mask-tile.js'
import { isTileOutsideEngland } from './is-tile-outside-england.js'

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
 * @param {{ z: string, x: string, y: string }} params
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

const seaMaskHandler = {
  method: 'GET',
  path: `${seaMaskRoutePath}/{z}/{x}/{y}.pbf`,
  options: {
    auth: false
  },
  async handler(request, h) {
    const { z, x, y } = request.params

    if (isTileOutsideEngland({ z: +z, x: +x, y: +y })) {
      return seaTile(h, allSeaTile)
    }

    try {
      const landTile = await fetchLandTile({ z, x, y })
      if (landTile === null) {
        return emptyTile(h)
      }

      return seaTile(h, buildSeaMaskTile(landTile))
    } catch (err) {
      logger.error(err, `Sea mask tile failed for ${z}/${x}/${y}`)
      return emptyTile(h)
    }
  }
}

export default [seaMaskHandler]
