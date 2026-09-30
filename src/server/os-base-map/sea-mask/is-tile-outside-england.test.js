import { describe, it, expect } from 'vitest'
import { isTileOutsideEngland } from './is-tile-outside-england.js'

describe('isTileOutsideEngland', () => {
  it.each([
    ['the whole world', { z: 0, x: 0, y: 0 }, false],
    ['East Anglia', { z: 11, x: 1031, y: 670 }, false],
    ["Land's End", { z: 11, x: 991, y: 693 }, false],
    ['the Isles of Scilly', { z: 11, x: 988, y: 695 }, false],
    ['the Scottish border', { z: 11, x: 1012, y: 640 }, false],
    ['the Scottish Highlands', { z: 11, x: 1000, y: 622 }, true],
    ['the Shetland Islands', { z: 11, x: 1017, y: 591 }, true],
    ['the mid Atlantic', { z: 11, x: 853, y: 647 }, true],
    ['Paris', { z: 11, x: 1037, y: 704 }, true]
  ])('treats a tile over %s as outside: %s', (_place, tile, expected) => {
    expect(isTileOutsideEngland(tile)).toBe(expected)
  })
})
