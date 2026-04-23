// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDefraApi,
  logWarning,
  parseDatasetJson,
  runWhenMapStyleReady,
  setControlPlacement,
  wireMapErrorLogging
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
