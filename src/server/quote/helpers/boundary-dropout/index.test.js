import { describe, it, expect } from 'vitest'
import { getBoundaryDropoutPath } from './index.js'
import {
  boundaryGeojson,
  boundaryGeojsonWithEdp,
  boundaryGeojsonWithExcludedArea
} from '../../../../test-utils/fixtures/boundary-geojson.js'

// A boundary seeded from a saved quote carries no intersectingExcludedAreas key.
const { intersectingExcludedAreas, ...seededBoundaryGeojson } =
  boundaryGeojsonWithEdp

describe('getBoundaryDropoutPath', () => {
  it.each([
    [
      'the excluded area dropout when an exclusion zone intersects',
      boundaryGeojsonWithExcludedArea,
      '/quote/excluded-area'
    ],
    [
      'the not in EDP dropout when no EDP intersects',
      boundaryGeojson,
      '/quote/not-in-edp'
    ],
    [
      'no dropout when an EDP intersects and no exclusion zone does',
      boundaryGeojsonWithEdp,
      undefined
    ],
    [
      'no dropout for a boundary seeded from a saved quote',
      seededBoundaryGeojson,
      undefined
    ]
  ])('returns %s', (_, boundaryGeojsonFixture, expected) => {
    expect(
      getBoundaryDropoutPath({ boundaryGeojson: boundaryGeojsonFixture })
    ).toBe(expected)
  })

  it('returns no dropout when no boundary is saved', () => {
    expect(getBoundaryDropoutPath(undefined)).toBeUndefined()
    expect(getBoundaryDropoutPath({})).toBeUndefined()
  })
})
