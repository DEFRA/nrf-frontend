import { config } from '../../../config/config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { getOrdnanceSurveyMapUrl } from '../ordnance-survey-url.js'
import { buildSeaMaskTile } from './build-sea-mask-tile.js'

const logger = createLogger()
const mvtContentType = 'application/vnd.mapbox-vector-tile'
const cacheControlHeader = 'cache-control'

export const seaMaskRoutePath = '/os-base-map/sea-mask'

function tileCacheControl() {
  return `public, max-age=${config.get('map.tileCacheControlMaxAge')}, immutable`
}

/**
 * The mask is decoration over the aerial imagery, so an upstream failure must
 * leave the map looking as it did before the layer existed rather than
 * surfacing an error the user can do nothing about.
 *
 * @param {import('@hapi/hapi').ResponseToolkit} h
 * @returns {import('@hapi/hapi').ResponseObject}
 */
function emptyTile(h) {
  return h
    .response(Buffer.alloc(0))
    .code(statusCodes.noContent)
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
  const response = await fetch(url, { redirect: 'follow' })

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

    try {
      const landTile = await fetchLandTile({ z, x, y })
      if (landTile === null) {
        return emptyTile(h)
      }

      return h
        .response(buildSeaMaskTile(landTile))
        .type(mvtContentType)
        .header(cacheControlHeader, tileCacheControl())
    } catch (err) {
      logger.error(err, `Sea mask tile failed for ${z}/${x}/${y}`)
      return emptyTile(h)
    }
  }
}

export default [seaMaskHandler]
