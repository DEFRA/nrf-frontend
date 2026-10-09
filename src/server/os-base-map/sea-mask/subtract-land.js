import * as polyclip from 'polyclip-ts'

/**
 * @param {{ extent: number, buffer: number }} params
 * @returns {number[][]} A closed ring covering the tile plus its overlap buffer.
 */
function getTileRing({ extent, buffer }) {
  const min = buffer > 0 ? -buffer : 0
  const max = extent + buffer

  return [
    [min, min],
    [max, min],
    [max, max],
    [min, max],
    [min, min]
  ]
}

/**
 * @param {{ rings: number[][][], extent: number, buffer: number }} params
 * @returns {number[][][][]} Sea polygons in tile-local coordinates.
 */
export function subtractLandFromTile({ rings, extent, buffer }) {
  const tile = [getTileRing({ extent, buffer })]

  if (rings.length === 0) {
    return [tile]
  }

  return polyclip.difference(tile, ...rings.map((ring) => [ring]))
}
