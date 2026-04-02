// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createMap, getMapStyles, getStyleControlsManifest } from './config.js'

afterEach(() => {
  delete globalThis.defra
  document.body.innerHTML = ''
})

describe('base-map config', () => {
  describe('getMapStyles', () => {
    it('returns all four style definitions with attribution', () => {
      expect(getMapStyles()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'esri-tiles' }),
          expect.objectContaining({ id: 'outdoor-os' }),
          expect.objectContaining({ id: 'dark' }),
          expect.objectContaining({ id: 'black-and-white' })
        ])
      )
      expect(getMapStyles()[0]).toEqual(
        expect.objectContaining({
          attribution: expect.stringContaining('Ordnance Survey')
        })
      )
    })
  })

  describe('createMap', () => {
    it('returns null when map element not found', () => {
      expect(createMap({ mapElementId: 'non-existent' })).toBeNull()
    })

    it('returns null when defraApi not available', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      expect(createMap({ mapElementId: 'test-map' })).toBeNull()
    })

    it('creates InteractiveMap with mapStyles and mapStyle set to first style', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      const mockMap = {}
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return mockMap
          }
        }),
        maplibreProvider: vi.fn()
      }

      const result = createMap({ mapElementId: 'test-map' })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          minZoom: 4,
          bounds: [-5.75, 49.95, 1.8, 55.85],
          maxBounds: [-5.75, 49.95, 1.8, 55.85],
          mapStyle: expect.objectContaining({ id: 'esri-tiles' }),
          mapStyles: expect.arrayContaining([
            expect.objectContaining({ id: 'esri-tiles' }),
            expect.objectContaining({ id: 'outdoor-os' })
          ])
        })
      )
      expect(result).toBe(mockMap)
    })

    it('merges additional options into the map options', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn()
      }

      createMap({
        mapElementId: 'test-map',
        mapLabel: 'My map',
        containerHeight: '400px',
        options: { bounds: [-8.75, 49.8, 2.1, 60.95] }
      })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          mapLabel: 'My map',
          containerHeight: '400px',
          bounds: [-8.75, 49.8, 2.1, 60.95]
        })
      )
    })

    it('supports legacy string signature for createMap', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap('test-map', {
        bounds: [-8.75, 49.8, 2.1, 60.95],
        maxBounds: [-8.75, 49.8, 2.1, 60.95]
      })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          bounds: [-8.75, 49.8, 2.1, 60.95],
          maxBounds: [-8.75, 49.8, 2.1, 60.95]
        })
      )
    })

    it('supports containerHeight resolver function', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      const containerHeight = vi.fn().mockReturnValue('320px')

      createMap({ mapElementId: 'test-map', containerHeight })

      expect(containerHeight).toHaveBeenCalledWith(el)
      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({ containerHeight: '320px' })
      )
    })

    it('adds style controls plugin when showStyleControls is true', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      const mapStylesPlugin = vi.fn().mockReturnValue({ id: 'mapStyles' })
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({}),
        mapStylesPlugin
      }

      createMap({ mapElementId: 'test-map', showStyleControls: true })

      expect(mapStylesPlugin).toHaveBeenCalledWith(
        expect.objectContaining({
          mapStyles: expect.any(Array),
          manifest: getStyleControlsManifest()
        })
      )
      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          plugins: [expect.objectContaining({ id: 'mapStyles' })]
        })
      )
    })

    it('does not add plugins when style controls requested but plugin unavailable', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map', showStyleControls: true })

      const options = constructorSpy.mock.calls[0][1]
      expect(options.plugins).toBeUndefined()
    })

    it('preserves existing plugins when style controls are disabled', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      const customPlugin = { id: 'custom-plugin' }
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({
        mapElementId: 'test-map',
        options: { plugins: [customPlugin] }
      })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          plugins: [customPlugin]
        })
      )
    })

    it('wires draw controls when showDrawControls is true', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const addButton = vi.fn()
      const addPanel = vi.fn()
      const map = {
        on: vi.fn((eventName, callback) => {
          if (eventName === 'app:ready') {
            callback()
          }
        }),
        addButton,
        addPanel
      }

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map', showDrawControls: true })

      expect(map.on).toHaveBeenCalledWith('app:ready', expect.any(Function))
      expect(addButton).toHaveBeenCalledWith(
        'draw',
        expect.objectContaining({
          panelId: 'draw',
          mobile: expect.objectContaining({ slot: 'top-left' }),
          desktop: expect.objectContaining({ slot: 'top-left' })
        })
      )
      expect(addPanel).toHaveBeenCalledWith(
        'draw',
        expect.objectContaining({
          tablet: expect.objectContaining({ slot: 'left-bottom' }),
          desktop: expect.objectContaining({ slot: 'left-bottom' })
        })
      )
    })

    it('does not wire draw controls when showDrawControls is false', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const map = {
        on: vi.fn(),
        addButton: vi.fn(),
        addPanel: vi.fn()
      }

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      expect(map.on).not.toHaveBeenCalledWith('app:ready', expect.any(Function))
      expect(map.addButton).not.toHaveBeenCalled()
      expect(map.addPanel).not.toHaveBeenCalled()
    })

    it('wires map instance error logging when mapErrorMessage is provided', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const mapInstance = { on: vi.fn() }
      const map = { on: vi.fn() }
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({
        mapElementId: 'test-map',
        mapErrorMessage: 'Boundary map error'
      })

      const readyCallback = map.on.mock.calls.find(
        (c) => c[0] === 'map:ready'
      )?.[1]
      readyCallback({ map: mapInstance })

      expect(map.on).toHaveBeenCalledWith('map:ready', expect.any(Function))
      expect(mapInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('adds transformRequest hook that resolves root-relative URLs', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      const transformed = options.transformRequest(
        '/public/data/vts/style.json'
      )

      expect(transformed).toEqual({
        url: `${globalThis.location.origin}/public/data/vts/style.json`
      })
    })

    it('adds transformStyle hook that normalizes style asset URLs', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      const style = {
        sprite: '/sprite',
        glyphs: '/fonts/{fontstack}/{range}.pbf',
        sources: {
          vts: {
            type: 'vector',
            url: '/public/data/vts/source.json',
            tiles: ['/public/data/vts/{z}/{x}/{y}.pbf', 'https://cdn.example/a']
          }
        }
      }

      const normalized = options.transformStyle(null, style)

      expect(normalized.sprite).toBe(`${globalThis.location.origin}/sprite`)
      expect(normalized.glyphs).toBe(
        `${globalThis.location.origin}/fonts/{fontstack}/{range}.pbf`
      )
      expect(normalized.sources.vts.url).toBe(
        `${globalThis.location.origin}/public/data/vts/source.json`
      )
      expect(normalized.sources.vts.tiles).toEqual([
        `${globalThis.location.origin}/public/data/vts/{z}/{x}/{y}.pbf`,
        'https://cdn.example/a'
      ])
    })

    it('keeps absolute URLs unchanged in transformRequest and transformStyle', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      expect(
        options.transformRequest('https://example.com/style.json')
      ).toEqual({
        url: 'https://example.com/style.json'
      })

      const style = {
        sprite: 'https://example.com/sprite',
        glyphs: 'https://example.com/fonts/{fontstack}/{range}.pbf',
        sources: {
          vts: {
            type: 'vector',
            url: 'https://example.com/source.json',
            tiles: ['https://example.com/{z}/{x}/{y}.pbf']
          }
        }
      }

      const normalized = options.transformStyle(null, style)

      expect(normalized).toEqual(style)
    })

    it('returns style unchanged when transformStyle receives non-object', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      expect(options.transformStyle(null, null)).toBeNull()
      expect(options.transformStyle(null, 'not-an-object')).toBe(
        'not-an-object'
      )
    })

    it('handles source definitions with non-array tiles', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      const style = {
        sprite: '/sprite',
        glyphs: '/glyphs',
        sources: {
          raster: {
            type: 'raster',
            url: '/source.json',
            tiles: '/single-tile-url'
          }
        }
      }

      const normalized = options.transformStyle(null, style)

      expect(normalized.sources.raster.url).toBe(
        `${globalThis.location.origin}/source.json`
      )
      expect(normalized.sources.raster.tiles).toBe('/single-tile-url')
    })
  })
})
