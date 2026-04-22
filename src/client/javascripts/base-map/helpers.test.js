// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDefraApi,
  logWarning,
  parseDatasetJson,
  patchFetchForSearchPlugin,
  runWhenMapStyleReady,
  setControlOrder,
  wireMapErrorLogging,
  wireSearchLabels
} from './helpers.js'

describe('base-map helpers', () => {
  let warnSpy

  beforeEach(() => {
    delete globalThis.defra
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  describe('logWarning', () => {
    it('logs message with empty error value when error is not provided', () => {
      logWarning('Something happened')

      expect(warnSpy).toHaveBeenCalledWith('Something happened', '')
    })
  })

  describe('getDefraApi', () => {
    it('returns null when defra global is missing', () => {
      expect(getDefraApi()).toBeNull()
    })

    it('returns null when required interactive map APIs are missing', () => {
      globalThis.defra = { InteractiveMap: vi.fn() }

      expect(getDefraApi()).toBeNull()
    })

    it('returns defra API when required dependencies are present', () => {
      const interactiveMap = vi.fn()
      const maplibreProvider = vi.fn()
      globalThis.defra = { InteractiveMap: interactiveMap, maplibreProvider }

      expect(getDefraApi()).toEqual({
        InteractiveMap: interactiveMap,
        maplibreProvider
      })
    })
  })

  describe('parseDatasetJson', () => {
    it('parses valid JSON from element dataset', () => {
      const element = document.createElement('div')
      element.dataset.geojson = '{"type":"FeatureCollection","features":[]}'

      const result = parseDatasetJson(
        element,
        'geojson',
        'Failed to parse boundary GeoJSON'
      )

      expect(result).toEqual({ type: 'FeatureCollection', features: [] })
    })

    it('returns null and logs warning when JSON cannot be parsed', () => {
      const element = document.createElement('div')
      element.dataset.geojson = '{invalid-json'

      const result = parseDatasetJson(
        element,
        'geojson',
        'Failed to parse boundary GeoJSON'
      )

      expect(result).toBeNull()
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to parse boundary GeoJSON',
        expect.any(SyntaxError)
      )
    })
  })

  describe('runWhenMapStyleReady', () => {
    it('executes callback immediately when style is loaded', () => {
      const callback = vi.fn()
      const mapInstance = {
        isStyleLoaded: vi.fn().mockReturnValue(true),
        once: vi.fn()
      }

      runWhenMapStyleReady(mapInstance, callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(mapInstance.once).not.toHaveBeenCalled()
    })

    it('registers style.load callback when style is not loaded', () => {
      const callback = vi.fn()
      const mapInstance = {
        isStyleLoaded: vi.fn().mockReturnValue(false),
        once: vi.fn()
      }

      runWhenMapStyleReady(mapInstance, callback)

      expect(mapInstance.once).toHaveBeenCalledWith('style.load', callback)
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('wireMapErrorLogging', () => {
    it('logs err.error when present', () => {
      const mapInstance = { on: vi.fn() }

      wireMapErrorLogging(mapInstance, 'Boundary map error')

      const errorHandler = mapInstance.on.mock.calls[0][1]
      errorHandler({ error: new Error('tile load failed') })

      expect(mapInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(warnSpy).toHaveBeenCalledWith(
        'Boundary map error',
        expect.any(Error)
      )
    })

    it('falls back to the event object when err.error is missing', () => {
      const mapInstance = { on: vi.fn() }

      wireMapErrorLogging(mapInstance, 'Boundary map error')

      const errorHandler = mapInstance.on.mock.calls[0][1]
      const errEvent = { message: 'something went wrong' }
      errorHandler(errEvent)

      expect(warnSpy).toHaveBeenCalledWith('Boundary map error', errEvent)
    })

    it('supports custom error extraction', () => {
      const mapInstance = { on: vi.fn() }

      wireMapErrorLogging(
        mapInstance,
        'Custom map error',
        (err) => err?.detail || err
      )

      const errorHandler = mapInstance.on.mock.calls[0][1]
      errorHandler({ detail: 'detail message' })

      expect(warnSpy).toHaveBeenCalledWith('Custom map error', 'detail message')
    })
  })

  describe('patchFetchForSearchPlugin', () => {
    let originalFetch

    beforeEach(() => {
      originalFetch = vi.fn().mockResolvedValue({ ok: true })
      globalThis.fetch = originalFetch
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('unwraps { url, options } objects before calling native fetch', async () => {
      patchFetchForSearchPlugin()
      await globalThis.fetch({ url: '/test', options: { method: 'GET' } })
      expect(originalFetch).toHaveBeenCalledWith('/test', { method: 'GET' })
    })

    it('passes string URLs through unchanged', async () => {
      patchFetchForSearchPlugin()
      await globalThis.fetch('/plain', { method: 'POST' })
      expect(originalFetch).toHaveBeenCalledWith('/plain', { method: 'POST' })
    })

    it('does not unwrap a Request instance', async () => {
      patchFetchForSearchPlugin()
      const req = new Request('https://example.com/req')
      await globalThis.fetch(req)
      expect(originalFetch).toHaveBeenCalledWith(req, undefined)
    })
  })

  describe('wireSearchLabels', () => {
    afterEach(() => {
      document.body.innerHTML = ''
    })

    function mountSearchDom(containerId) {
      const container = document.createElement('div')
      container.id = containerId
      container.innerHTML = `
        <label for="map-search" class="im-u-visually-hidden">Search</label>
        <input id="map-search" class="im-c-search__input" placeholder="Search" />
      `
      document.body.appendChild(container)
      return container
    }

    function makeMap() {
      const handlers = {}
      return {
        on: vi.fn((event, cb) => {
          handlers[event] = cb
        }),
        fire: (event) => handlers[event]?.()
      }
    }

    it('overrides placeholder, aria-label and hidden label on app:ready', () => {
      mountSearchDom('test-map')
      const map = makeMap()

      wireSearchLabels(map, 'test-map')
      map.fire('app:ready')

      const input = document.querySelector('.im-c-search__input')
      expect(input.placeholder).toBe('Search for an address or postcode')
      expect(input.getAttribute('aria-label')).toBe(
        'Search for an address or postcode'
      )
      expect(
        document.querySelector('label.im-u-visually-hidden').textContent
      ).toBe('Search for an address or postcode')
    })

    it('accepts a custom label', () => {
      mountSearchDom('test-map')
      const map = makeMap()

      wireSearchLabels(map, 'test-map', 'Find a place')
      map.fire('app:ready')

      expect(document.querySelector('.im-c-search__input').placeholder).toBe(
        'Find a place'
      )
    })

    it('does not throw when the search input has not yet mounted', () => {
      const container = document.createElement('div')
      container.id = 'test-map'
      document.body.appendChild(container)
      const map = makeMap()

      wireSearchLabels(map, 'test-map')
      expect(() => map.fire('app:ready')).not.toThrow()
    })
  })

  describe('setControlOrder', () => {
    function makeSearchPlugin() {
      return {
        manifest: {
          controls: [
            {
              id: 'search',
              mobile: { slot: 'top-right', showLabel: false },
              tablet: { slot: 'top-left', showLabel: false },
              desktop: { slot: 'top-left', showLabel: false }
            }
          ]
        }
      }
    }

    function makeStylesPlugin() {
      return {
        manifest: {
          buttons: [
            {
              id: 'mapStyles',
              mobile: { slot: 'top-left' },
              tablet: { slot: 'top-left' },
              desktop: { slot: 'top-left' }
            }
          ]
        }
      }
    }

    it('sets order on all breakpoint descriptors of a matching control id', () => {
      const plugin = makeSearchPlugin()

      setControlOrder(plugin, 'search', 1)

      expect(plugin.manifest.controls[0].mobile.order).toBe(1)
      expect(plugin.manifest.controls[0].tablet.order).toBe(1)
      expect(plugin.manifest.controls[0].desktop.order).toBe(1)
    })

    it('sets order on all breakpoint descriptors of a matching button id', () => {
      const plugin = makeStylesPlugin()

      setControlOrder(plugin, 'mapStyles', 2)

      expect(plugin.manifest.buttons[0].mobile.order).toBe(2)
      expect(plugin.manifest.buttons[0].tablet.order).toBe(2)
      expect(plugin.manifest.buttons[0].desktop.order).toBe(2)
    })

    it('preserves existing breakpoint descriptor fields', () => {
      const plugin = makeSearchPlugin()

      setControlOrder(plugin, 'search', 1)

      expect(plugin.manifest.controls[0].mobile).toEqual(
        expect.objectContaining({ slot: 'top-right', showLabel: false })
      )
    })

    it('does not mutate the original breakpoint descriptor objects', () => {
      const plugin = makeSearchPlugin()
      const originalMobile = plugin.manifest.controls[0].mobile
      const originalTablet = plugin.manifest.controls[0].tablet
      const originalDesktop = plugin.manifest.controls[0].desktop

      setControlOrder(plugin, 'search', 1)

      expect(originalMobile).not.toHaveProperty('order')
      expect(originalTablet).not.toHaveProperty('order')
      expect(originalDesktop).not.toHaveProperty('order')
    })

    it('is a no-op when plugin is null or has no manifest', () => {
      expect(() => setControlOrder(null, 'search', 1)).not.toThrow()
      expect(() => setControlOrder({}, 'search', 1)).not.toThrow()
      expect(() => setControlOrder({ manifest: {} }, 'search', 1)).not.toThrow()
    })

    it('is a no-op when no entry matches the id', () => {
      const plugin = makeSearchPlugin()
      const snapshot = JSON.stringify(plugin)

      setControlOrder(plugin, 'does-not-exist', 1)

      expect(JSON.stringify(plugin)).toBe(snapshot)
    })

    it('only sets order on breakpoint descriptors that exist', () => {
      const plugin = {
        manifest: {
          controls: [
            {
              id: 'search',
              desktop: { slot: 'top-left' }
            }
          ]
        }
      }

      expect(() => setControlOrder(plugin, 'search', 1)).not.toThrow()
      expect(plugin.manifest.controls[0].desktop.order).toBe(1)
      expect(plugin.manifest.controls[0].mobile).toBeUndefined()
      expect(plugin.manifest.controls[0].tablet).toBeUndefined()
    })
  })
})
