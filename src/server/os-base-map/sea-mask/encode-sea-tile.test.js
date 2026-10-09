import { describe, it, expect } from 'vitest'
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import { encodeSeaTile, seaLayerName } from './encode-sea-tile.js'

const extent = 8192
const square = [
  [
    [0, 0],
    [extent, 0],
    [extent, extent],
    [0, extent],
    [0, 0]
  ]
]

describe('encodeSeaTile', () => {
  it('round-trips sea polygons through a decodable vector tile', () => {
    const buffer = encodeSeaTile({ polygons: [square], extent })

    const layer = new VectorTile(new PbfReader(buffer)).layers[seaLayerName]
    expect(layer.extent).toBe(extent)
    expect(layer.length).toBe(1)

    const geometry = layer.feature(0).loadGeometry()
    expect(geometry[0].map((point) => [point.x, point.y])).toEqual(square[0])
  })
})
