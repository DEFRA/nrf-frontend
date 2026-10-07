import { ENGLAND_MAX_BOUNDS } from '../../../client/javascripts/map/shared-helpers/constants.js'

// The same box the map is held within, so every tile a user can pan to is
// still masked against the real coastline.
const [westBound, southBound, eastBound, northBound] = ENGLAND_MAX_BOUNDS

const degreesInCircle = 360
const degreesInHalfCircle = 180

function tileToLongitude({ x, z }) {
  return (x / 2 ** z) * degreesInCircle - degreesInHalfCircle
}

function tileToLatitude({ y, z }) {
  const mercatorY = Math.PI * (1 - (2 * y) / 2 ** z)
  return (Math.atan(Math.sinh(mercatorY)) * degreesInHalfCircle) / Math.PI
}

/**
 * @param {{ z: number, x: number, y: number }} tile
 * @returns {boolean}
 */
export function isTileOutsideEngland({ z, x, y }) {
  const west = tileToLongitude({ x, z })
  const east = tileToLongitude({ x: x + 1, z })
  const north = tileToLatitude({ y, z })
  const south = tileToLatitude({ y: y + 1, z })

  return (
    east < westBound ||
    west > eastBound ||
    north < southBound ||
    south > northBound
  )
}
