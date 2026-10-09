import { extractLandRings } from './extract-land-rings.js'
import { subtractLandFromTile } from './subtract-land.js'
import { encodeSeaTile } from './encode-sea-tile.js'

/**
 * @param {Buffer} tileBuffer An OS vector tile.
 * @returns {Buffer} A single-layer tile holding the water part of the same tile.
 */
export function buildSeaMaskTile(tileBuffer) {
  const { rings, extent, buffer } = extractLandRings(tileBuffer)
  const polygons = subtractLandFromTile({ rings, extent, buffer })

  return encodeSeaTile({ polygons, extent })
}
