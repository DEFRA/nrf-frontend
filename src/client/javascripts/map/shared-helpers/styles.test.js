import { describe, expect, it } from 'vitest'
import { getMapStyles } from './styles.js'
import aerialStyle from '../../../data/vts/APGB_Aerial.json'
import hybridStyle from '../../../data/vts/APGB_Hybrid.json'

describe('getMapStyles', () => {
  it('keeps aerial at index 0, the map default style', () => {
    // create-interactive-map.js reads mapStyles[0] as the initial style, so
    // this index is behaviour, not presentation.
    const styles = getMapStyles()

    expect(styles).toHaveLength(5)
    expect(styles[0]).toEqual(
      expect.objectContaining({ id: 'aerial', label: 'Aerial' })
    )
  })

  it('no longer offers the esri satellite basemap', () => {
    expect(getMapStyles().map((style) => style.id)).not.toContain('esri-tiles')
  })

  it('points aerial at its own thumbnail file', () => {
    const [aerial] = getMapStyles()

    expect(aerial.thumbnail).toMatch(/aerial\.jpg$/)
  })

  it.each([
    ['aerial', aerialStyle],
    ['hybrid', hybridStyle]
  ])(
    'credits %s imagery to APGB and the sea mask coastline to Ordnance Survey',
    (id, style) => {
      const mapStyle = getMapStyles().find((entry) => entry.id === id)

      expect(mapStyle.attribution).toContain(
        style.sources['apgb-aerial'].attribution
      )
      expect(mapStyle.attribution).toMatch(/Ordnance Survey/)
    }
  )

  it('offers hybrid straight after aerial', () => {
    const [, hybrid] = getMapStyles()

    expect(hybrid).toEqual(
      expect.objectContaining({ id: 'hybrid', label: 'Hybrid' })
    )
    expect(hybrid.url).toMatch(/APGB_Hybrid\.json$/)
    expect(hybrid.thumbnail).toMatch(/hybrid\.jpg$/)
  })
})

describe('APGB_Hybrid.json', () => {
  const layerIds = hybridStyle.layers.map((layer) => layer.id)

  it('shades the sea and land outside imagery coverage as the aerial style does', () => {
    expect(hybridStyle.sources['sea-mask']).toEqual(
      aerialStyle.sources['sea-mask']
    )
    expect(hybridStyle.layers.slice(0, 3)).toEqual(aerialStyle.layers)
  })

  it('draws labels above the sea mask so they stay readable over water', () => {
    const firstLabel = hybridStyle.layers.findIndex(
      (layer) => layer.type === 'symbol'
    )

    expect(layerIds.indexOf('sea-mask')).toBeLessThan(firstLabel)
  })

  it('writes every label in white so it reads against the dark halo', () => {
    const darkLabels = hybridStyle.layers
      .filter((layer) => layer.layout?.['text-field'])
      .filter((layer) => !/^#F[CF]F[DF]FF$/.test(layer.paint['text-color']))
      .map((layer) => layer.id)

    expect(darkLabels).toEqual([])
  })

  it('reads Ordnance Survey tiles and fonts through the os-base-map proxy', () => {
    expect(hybridStyle.sources.esri.tiles).toEqual([
      '/os-base-map/tile/{z}/{y}/{x}.pbf'
    ])
    expect(hybridStyle.glyphs).toMatch(/^\/os-base-map\//)
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
