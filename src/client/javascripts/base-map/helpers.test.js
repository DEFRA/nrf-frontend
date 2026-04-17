// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDefraApi,
  logWarning,
  parseDatasetJson,
  patchFetchForSearchPlugin,
  runWhenMapStyleReady,
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
})
