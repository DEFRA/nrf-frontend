import { describe, expect, it } from 'vitest'
import { getMapStyles } from './styles.js'
import aerialStyle from '../../../data/vts/APGB_Aerial.json'

describe('getMapStyles', () => {
  it('keeps aerial at index 0, the map default style', () => {
    // create-interactive-map.js reads mapStyles[0] as the initial style, so
    // this index is behaviour, not presentation.
    const styles = getMapStyles()

    expect(styles).toHaveLength(4)
    expect(styles[0]).toEqual(
      expect.objectContaining({ id: 'aerial', label: 'Aerial' })
    )
  })

  it('no longer offers the esri satellite basemap', () => {
    expect(getMapStyles().map((style) => style.id)).not.toContain('esri-tiles')
  })

  it('points aerial at its own thumbnail file', () => {
    const [aerial] = getMapStyles()

    expect(aerial.thumbnail).toMatch(/aerial\.svg$/)
  })

  it('credits aerial imagery to APGB rather than Ordnance Survey', () => {
    const [aerial, outdoorOs] = getMapStyles()

    expect(aerial.attribution).not.toBe(outdoorOs.attribution)
    expect(aerial.attribution).not.toMatch(/Ordnance Survey/)
  })

  it('takes the aerial credit from the style JSON so the two cannot drift', () => {
    const [source] = Object.values(aerialStyle.sources)
    const [aerial] = getMapStyles()

    expect(aerial.attribution).toBe(source.attribution)
    expect(aerial.attribution).toBe(
      '© Bluesky International Limited and Getmapping Limited 1999-2020<br>© Bluesky International Limited 2021 and onwards'
    )
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

  it('caps the source at the upstream tile matrix ceiling of 21', () => {
    // The APGB WMTS GoogleMapsExtended matrix set stops at zoom 21; asking the
    // proxy for z22 makes upstream reply 400 and the proxy serve its grey "No
    // imagery available" placeholder, tiling that text across the map. The
    // draw map sets no maxZoom, so MapLibre would otherwise request z22. With
    // a source maxzoom it over-zooms the z21 tiles instead.
    const [source] = Object.values(aerialStyle.sources)

    expect(source.maxzoom).toBe(21)
  })
})
