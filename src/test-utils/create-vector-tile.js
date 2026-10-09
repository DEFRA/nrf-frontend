import { fromGeojsonVt } from '@maplibre/vt-pbf'

/**
 * Encodes a real vector tile so decoding logic can be tested against bytes
 * rather than a hand-shaped mock of the decoder's API.
 *
 * @param {{ layers: Record<string, number[][][]>, extent?: number }} params
 * @returns {Buffer}
 */
export function createVectorTile({ layers, extent = 4096 }) {
  const encoded = Object.fromEntries(
    Object.entries(layers).map(([name, polygons]) => [
      name,
      {
        features: polygons.map(function toFeature(rings, id) {
          return { id, type: 3, tags: {}, geometry: rings }
        })
      }
    ])
  )

  return Buffer.from(fromGeojsonVt(encoded, { version: 2, extent }))
}
