import { describe, it, expect } from 'vitest'
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import { createVectorTile } from '../../../test-utils/create-vector-tile.js'
import { buildSeaMaskTile } from './build-sea-mask-tile.js'
import { seaLayerName } from './encode-sea-tile.js'

const extent = 4096

function readSeaLayer(buffer) {
  return new VectorTile(new PbfReader(buffer)).layers[seaLayerName]
}

describe('buildSeaMaskTile', () => {
  it('masks the water side of a tile the coastline runs through', () => {
    const westernHalfIsLand = [
      [
        [0, 0],
        [extent / 2, 0],
        [extent / 2, extent],
        [0, extent],
        [0, 0]
      ]
    ]
    const upstream = createVectorTile({
      layers: { GB_land: [westernHalfIsLand] },
      extent
    })

    const layer = readSeaLayer(buildSeaMaskTile(upstream))

    expect(layer.length).toBe(1)
    const xs = layer
      .feature(0)
      .loadGeometry()[0]
      .map((point) => point.x)
    expect(Math.min(...xs)).toBe(extent / 2)
    expect(Math.max(...xs)).toBe(extent)
  })

  it('masks the whole tile when the upstream tile is empty', () => {
    const layer = readSeaLayer(buildSeaMaskTile(Buffer.alloc(0)))

    expect(layer.length).toBe(1)
  })

  it('produces no sea feature for a tile that is entirely land', () => {
    const wholeTile = [
      [
        [0, 0],
        [extent, 0],
        [extent, extent],
        [0, extent],
        [0, 0]
      ]
    ]
    const upstream = createVectorTile({
      layers: { GB_land: [wholeTile] },
      extent
    })

    expect(readSeaLayer(buildSeaMaskTile(upstream))).toBeUndefined()
  })
})
