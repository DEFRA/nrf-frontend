import { describe, it, expect } from 'vitest'
import { createVectorTile } from '../../../test-utils/create-vector-tile.js'
import { extractLandRings } from './extract-land-rings.js'

const triangle = [
  [
    [0, 0],
    [2048, 0],
    [0, 2048],
    [0, 0]
  ]
]

describe('extractLandRings', () => {
  it("reads the layer's own extent rather than assuming 4096", () => {
    const tile = createVectorTile({
      layers: { GB_land: [triangle] },
      extent: 8192
    })

    expect(extractLandRings(tile).extent).toBe(8192)
  })

  it('leaves non-GB land out of the mask so it can carry its own colour', () => {
    const tile = createVectorTile({ layers: { European_land: [triangle] } })

    expect(extractLandRings(tile).rings).toEqual([])
  })
})
