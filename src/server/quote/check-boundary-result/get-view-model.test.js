import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

describe('getViewModel', () => {
  it('should return featureCount of 0 when geojson has no features property', () => {
    const result = getViewModel({ type: 'FeatureCollection' })

    expect(result.featureCount).toBe(0)
    expect(result.pageHeading).toBe('Check your boundary')
    expect(result.boundaryGeojson).toBe(
      JSON.stringify({ type: 'FeatureCollection' })
    )
  })

  it('should return the correct feature count', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Polygon' } },
        { type: 'Feature', geometry: { type: 'Polygon' } }
      ]
    }

    const result = getViewModel(geojson)

    expect(result.featureCount).toBe(2)
  })
})
