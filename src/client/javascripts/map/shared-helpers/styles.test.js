import { describe, expect, it } from 'vitest'
import { getMapStyles } from './styles.js'
import aerialStyle from '../../../data/vts/APGB_Aerial.json'

describe('getMapStyles', () => {
  it('offers the aerial basemap at index 1', () => {
    const styles = getMapStyles()

    expect(styles).toHaveLength(5)
    expect(styles[1]).toEqual(
      expect.objectContaining({ id: 'aerial', label: 'Aerial' })
    )
  })

  it('keeps esri-tiles at index 0, the map default style', () => {
    // create-interactive-map.js reads mapStyles[0] as the initial style, so
    // this index is behaviour, not presentation.
    expect(getMapStyles()[0]).toEqual(
      expect.objectContaining({ id: 'esri-tiles' })
    )
  })

  it('points aerial at its own thumbnail file, not the shared esri one', () => {
    // The two thumbnails deliberately show the same artwork, but aerial keeps
    // its own copy so deleting the esri assets does not break it.
    const [satellite, aerial] = getMapStyles()

    expect(aerial.thumbnail).toMatch(/aerial\.svg$/)
    expect(aerial.thumbnail).not.toBe(satellite.thumbnail)
  })

  it('credits aerial imagery to APGB rather than Ordnance Survey', () => {
    const [satellite, aerial] = getMapStyles()

    expect(aerial.attribution).not.toBe(satellite.attribution)
    expect(aerial.attribution).not.toMatch(/Ordnance Survey/)
  })
})

describe('APGB_Aerial.json', () => {
  it('sources its tiles from the impact assessor aerial proxy', () => {
    const [source] = Object.values(aerialStyle.sources)

    expect(source.type).toBe('raster')
    expect(source.tiles).toEqual([
      '/impact-assessor-map/aerial_proxy/{z}/{x}/{y}'
    ])
  })

  it('sets no source maxzoom, matching the other styles', () => {
    const [source] = Object.values(aerialStyle.sources)

    expect(source.maxzoom).toBeUndefined()
  })
})
