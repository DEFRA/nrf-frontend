// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

import {
  normalizeMapStyle,
  createMapStyleRequestHooks,
  getDrawBoundaryMapStyles,
  getMapStylesPluginManifest,
  getDrawBoundaryMapOptions
} from './config.js'

describe('draw-boundary-map config', () => {
  it('normalizes style URLs to absolute URLs', () => {
    const baseUrl = 'http://example.test'
    const style = {
      version: 8,
      sprite: '/public/images/sprite',
      glyphs: '/public/fonts/{fontstack}/{range}.pbf',
      sources: {
        basemap: {
          type: 'vector',
          url: '/public/source.json',
          tiles: ['/public/tiles/{z}/{x}/{y}.pbf']
        }
      }
    }

    expect(normalizeMapStyle(style, baseUrl)).toEqual({
      version: 8,
      sprite: 'http://example.test/public/images/sprite',
      glyphs: 'http://example.test/public/fonts/{fontstack}/{range}.pbf',
      sources: {
        basemap: {
          type: 'vector',
          url: 'http://example.test/public/source.json',
          tiles: ['http://example.test/public/tiles/{z}/{x}/{y}.pbf']
        }
      }
    })
  })

  it('creates request hooks that keep absolute URLs and convert relative URLs', () => {
    const hooks = createMapStyleRequestHooks('http://example.test')

    expect(hooks.transformRequest('/tile/0/0/0.pbf')).toEqual({
      url: 'http://example.test/tile/0/0/0.pbf'
    })

    expect(
      hooks.transformRequest('https://server.arcgisonline.com/tile')
    ).toEqual({
      url: 'https://server.arcgisonline.com/tile'
    })

    expect(
      hooks.transformStyle(undefined, {
        version: 8,
        sprite: '/public/sprite'
      })
    ).toEqual({
      version: 8,
      sprite: 'http://example.test/public/sprite',
      sources: {}
    })
  })

  it('returns map styles and map styles manifest for plugin config', () => {
    const mapStyles = getDrawBoundaryMapStyles()
    const manifest = getMapStylesPluginManifest()

    expect(mapStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'esri-tiles' }),
        expect.objectContaining({ id: 'outdoor-os' }),
        expect.objectContaining({ id: 'dark' }),
        expect.objectContaining({ id: 'black-and-white' })
      ])
    )

    expect(manifest).toEqual(
      expect.objectContaining({
        panels: expect.any(Array),
        buttons: expect.any(Array)
      })
    )
  })

  it('builds map options with defaults, uk bounds and plugin', () => {
    const mapStylesPlugin = vi.fn().mockReturnValue({ id: 'mapStyles' })
    const options = getDrawBoundaryMapOptions({
      mapProvider: { provider: 'maplibre' },
      mapStyleUrl: '',
      mapStyles: getDrawBoundaryMapStyles(),
      mapStylesPlugin,
      containerHeight: '450px'
    })

    expect(options).toEqual(
      expect.objectContaining({
        behaviour: 'inline',
        mapLabel: 'Draw boundary map',
        bounds: [-8.75, 49.8, 2.1, 60.95],
        maxBounds: [-8.75, 49.8, 2.1, 60.95],
        containerHeight: '450px',
        plugins: [expect.objectContaining({ id: 'mapStyles' })],
        mapStyle: expect.objectContaining({
          url: '/public/data/vts/ESRI_World_Imagery.json'
        })
      })
    )

    expect(mapStylesPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        mapStyles: expect.any(Array),
        manifest: expect.objectContaining({
          panels: expect.any(Array),
          buttons: expect.any(Array)
        })
      })
    )
  })

  it('builds map options without plugin when map styles plugin is not provided', () => {
    const options = getDrawBoundaryMapOptions({
      mapProvider: { provider: 'maplibre' },
      mapStyleUrl: '/public/data/vts/OS_VTS_3857_Outdoor.json',
      mapStyles: getDrawBoundaryMapStyles(),
      mapStylesPlugin: null
    })

    expect(options.plugins).toEqual([])
    expect(options.mapStyle.url).toBe(
      '/public/data/vts/OS_VTS_3857_Outdoor.json'
    )
  })
})
