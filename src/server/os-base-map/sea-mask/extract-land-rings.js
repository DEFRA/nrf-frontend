import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'

// Only GB carries aerial imagery. Ireland and the continent are land, but the
// imagery is blank there too, so they are masked and then recoloured by their
// own layer rather than being left as holes in the sea.
const landLayerNames = ['GB_land']
const polygonFeatureType = 3

/**
 * OS tiles carry a small overlap beyond the tile edge. Differencing against the
 * unbuffered box would leave a hairline of unmasked imagery along every shared
 * edge, so the buffer is measured and handed on with the rings.
 *
 * @param {import('@mapbox/vector-tile').VectorTileLayer} layer
 * @returns {number}
 */
function getLayerBuffer(layer) {
  let buffer = 0

  for (let index = 0; index < layer.length; index++) {
    const [left, top, right, bottom] = layer.feature(index).bbox()
    buffer = Math.max(
      buffer,
      -left,
      -top,
      right - layer.extent,
      bottom - layer.extent
    )
  }

  return Math.max(buffer, 0)
}

/**
 * @param {Buffer} tileBuffer
 * @returns {{ rings: number[][][], extent: number, buffer: number }}
 */
export function extractLandRings(tileBuffer) {
  const tile = new VectorTile(new PbfReader(tileBuffer))
  const rings = []
  let extent = 4096
  let buffer = 0

  for (const name of landLayerNames) {
    const layer = tile.layers[name]
    if (!layer) {
      continue
    }

    extent = layer.extent
    buffer = Math.max(buffer, getLayerBuffer(layer))

    for (let index = 0; index < layer.length; index++) {
      const feature = layer.feature(index)
      if (feature.type !== polygonFeatureType) {
        continue
      }

      for (const ring of feature.loadGeometry()) {
        if (ring.length < 4) {
          continue
        }
        rings.push(ring.map((point) => [point.x, point.y]))
      }
    }
  }

  return { rings, extent, buffer }
}
