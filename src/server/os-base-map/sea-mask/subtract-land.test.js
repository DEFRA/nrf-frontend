import { describe, it, expect } from 'vitest'
import { subtractLandFromTile } from './subtract-land.js'

const extent = 4096

describe('subtractLandFromTile', () => {
  it('treats a tile with no land as entirely sea', () => {
    const sea = subtractLandFromTile({ rings: [], extent, buffer: 0 })

    expect(sea).toEqual([
      [
        [
          [0, 0],
          [extent, 0],
          [extent, extent],
          [0, extent],
          [0, 0]
        ]
      ]
    ])
  })

  it('yields no sea for a tile the land polygon covers completely', () => {
    const fullTile = [
      [-64, -64],
      [extent + 64, -64],
      [extent + 64, extent + 64],
      [-64, extent + 64],
      [-64, -64]
    ]

    const sea = subtractLandFromTile({ rings: [fullTile], extent, buffer: 64 })

    expect(sea).toEqual([])
  })

  it('returns only the water side of a tile the coastline runs through', () => {
    const westernHalfIsLand = [
      [0, 0],
      [extent / 2, 0],
      [extent / 2, extent],
      [0, extent],
      [0, 0]
    ]

    const sea = subtractLandFromTile({
      rings: [westernHalfIsLand],
      extent,
      buffer: 0
    })

    expect(sea).toHaveLength(1)
    expect(sea[0]).toHaveLength(1)
    const xs = sea[0][0].map(([x]) => x)
    expect(Math.min(...xs)).toBe(extent / 2)
    expect(Math.max(...xs)).toBe(extent)
  })
})
