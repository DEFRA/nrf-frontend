// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDefraApi,
  logWarning,
  parseDatasetJson,
  patchFetchForSearchPlugin,
  runWhenMapStyleReady,
  setControlPlacement,
  wireMapErrorLogging,
  wireSearchErrorBanner,
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

    it('is idempotent — does not stack wrappers on repeat calls', async () => {
      patchFetchForSearchPlugin()
      const firstPatched = globalThis.fetch
      patchFetchForSearchPlugin()
      expect(globalThis.fetch).toBe(firstPatched)

      await globalThis.fetch({ url: '/test', options: { method: 'GET' } })
      expect(originalFetch).toHaveBeenCalledTimes(1)
      expect(originalFetch).toHaveBeenCalledWith('/test', { method: 'GET' })
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

  describe('wireSearchErrorBanner', () => {
    let originalFetch

    beforeEach(() => {
      originalFetch = globalThis.fetch
    })

    afterEach(() => {
      document.body.innerHTML = ''
      globalThis.fetch = originalFetch
    })

    function mountSearchContainer(containerId, { withInput = false } = {}) {
      const container = document.createElement('div')
      container.id = containerId
      const form = document.createElement('form')
      form.className = 'im-c-search-form'
      if (withInput) {
        const input = document.createElement('input')
        input.className = 'im-c-search__input'
        input.id = 'map-search'
        form.appendChild(input)
      }
      container.appendChild(form)
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

    it('shows an alert banner after a proxy request returns a non-OK response', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      const banner = document.querySelector('.app-c-search-error')
      expect(banner).not.toBeNull()
      expect(banner.hidden).toBe(false)
      expect(banner.getAttribute('role')).toBe('alert')
      expect(banner.textContent).toContain('could not search')
    })

    it('shows the banner when the proxy request rejects (network error)', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'))

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await expect(
        globalThis.fetch('/os-names-search?query=york')
      ).rejects.toThrow('offline')

      const banner = document.querySelector('.app-c-search-error')
      expect(banner.hidden).toBe(false)
    })

    it('hides the banner on the next successful proxy response', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 502 })
        .mockResolvedValueOnce({ ok: true, status: 200 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')
      expect(document.querySelector('.app-c-search-error').hidden).toBe(false)

      await globalThis.fetch('/os-names-search?query=york')
      expect(document.querySelector('.app-c-search-error').hidden).toBe(true)
    })

    it('ignores non-search fetch calls', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/some/other/endpoint')

      const banner = document.querySelector('.app-c-search-error')
      expect(banner.hidden).toBe(true)
    })

    it('recognises the { url, options } shape used by the search plugin', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch({
        url: '/os-names-search?query=york',
        options: {}
      })

      expect(document.querySelector('.app-c-search-error').hidden).toBe(false)
    })

    it('does not stack watchers on repeat calls', () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      const firstPatched = globalThis.fetch
      wireSearchErrorBanner(map, 'test-map')
      expect(globalThis.fetch).toBe(firstPatched)
    })

    it('accepts a custom error message', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map', 'Something went wrong')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      expect(document.querySelector('.app-c-search-error').textContent).toBe(
        'Something went wrong'
      )
    })

    it('links the search input to the banner via aria-describedby on error', async () => {
      mountSearchContainer('test-map', { withInput: true })
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      const input = document.querySelector('.im-c-search__input')
      const banner = document.querySelector('.app-c-search-error')
      expect(banner.id).toBe('app-c-search-error')
      expect(input.getAttribute('aria-describedby')).toBe('app-c-search-error')
    })

    it('removes aria-describedby once a subsequent request succeeds', async () => {
      mountSearchContainer('test-map', { withInput: true })
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')
      await globalThis.fetch('/os-names-search?query=york')

      const input = document.querySelector('.im-c-search__input')
      expect(input.hasAttribute('aria-describedby')).toBe(false)
    })

    it('preserves pre-existing aria-describedby ids when linking the banner', async () => {
      const container = mountSearchContainer('test-map', { withInput: true })
      const input = container.querySelector('.im-c-search__input')
      input.setAttribute('aria-describedby', 'other-hint')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      expect(input.getAttribute('aria-describedby')).toBe(
        'other-hint app-c-search-error'
      )
    })
  })

  describe('setControlPlacement', () => {
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

    it('overrides slot and order on all breakpoint descriptors of a matching control id', () => {
      const plugin = makeSearchPlugin()

      setControlPlacement(plugin, 'search', {
        mobile: { slot: 'banner', order: 1 },
        tablet: { slot: 'top-left', order: 1 },
        desktop: { slot: 'top-left', order: 1 }
      })

      expect(plugin.manifest.controls[0].mobile).toEqual(
        expect.objectContaining({ slot: 'banner', showLabel: false, order: 1 })
      )
      expect(plugin.manifest.controls[0].tablet).toEqual(
        expect.objectContaining({
          slot: 'top-left',
          showLabel: false,
          order: 1
        })
      )
      expect(plugin.manifest.controls[0].desktop).toEqual(
        expect.objectContaining({
          slot: 'top-left',
          showLabel: false,
          order: 1
        })
      )
    })

    it('overrides slot and order on all breakpoint descriptors of a matching button id', () => {
      const plugin = makeStylesPlugin()

      setControlPlacement(plugin, 'mapStyles', {
        mobile: { slot: 'top-left', order: 2 },
        tablet: { slot: 'top-left', order: 2 },
        desktop: { slot: 'top-left', order: 2 }
      })

      expect(plugin.manifest.buttons[0].mobile).toEqual(
        expect.objectContaining({ slot: 'top-left', order: 2 })
      )
      expect(plugin.manifest.buttons[0].tablet).toEqual(
        expect.objectContaining({ slot: 'top-left', order: 2 })
      )
      expect(plugin.manifest.buttons[0].desktop).toEqual(
        expect.objectContaining({ slot: 'top-left', order: 2 })
      )
    })

    it('adds missing breakpoint descriptors from the provided placement', () => {
      const plugin = {
        manifest: {
          controls: [
            {
              id: 'search',
              tablet: { slot: 'top-left' }
            }
          ]
        }
      }

      setControlPlacement(plugin, 'search', {
        mobile: { slot: 'banner', order: 1 },
        tablet: { slot: 'top-left', order: 1 },
        desktop: { slot: 'top-left', order: 1 }
      })

      expect(plugin.manifest.controls[0].mobile).toEqual({
        slot: 'banner',
        order: 1
      })
      expect(plugin.manifest.controls[0].tablet).toEqual({
        slot: 'top-left',
        order: 1
      })
      expect(plugin.manifest.controls[0].desktop).toEqual({
        slot: 'top-left',
        order: 1
      })
    })

    it('is a no-op when plugin is null or has no manifest', () => {
      expect(() =>
        setControlPlacement(null, 'search', { mobile: { slot: 'banner' } })
      ).not.toThrow()
      expect(() =>
        setControlPlacement({}, 'search', { mobile: { slot: 'banner' } })
      ).not.toThrow()
      expect(() =>
        setControlPlacement({ manifest: {} }, 'search', {
          mobile: { slot: 'banner' }
        })
      ).not.toThrow()
    })
  })
})
