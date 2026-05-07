// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getDefraApi,
  parseDatasetJson,
  resolveSearchPlugin,
  runWhenMapStyleReady,
  wireMapErrorLogging
} from './helpers.js'

describe('base-map helpers', () => {
  beforeEach(() => {
    delete globalThis.defra
    globalThis.fetch = vi.fn().mockResolvedValue({})
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

    it('returns null and sends error log when JSON cannot be parsed', () => {
      const element = document.createElement('div')
      element.dataset.geojson = '{invalid-json'

      const result = parseDatasetJson(
        element,
        'geojson',
        'Failed to parse boundary GeoJSON'
      )

      expect(result).toBeNull()
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/browser-logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Failed to parse boundary GeoJSON')
        })
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

  describe('resolveSearchPlugin', () => {
    it('returns null and sends info log when searchPlugin is not available', () => {
      const result = resolveSearchPlugin({})

      expect(result).toBeNull()
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/browser-logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(
            'Search plugin not available, search disabled'
          )
        })
      )
    })

    it('returns searchPlugin function when available', () => {
      const searchPlugin = vi.fn()

      const result = resolveSearchPlugin({ searchPlugin })

      expect(result).toBe(searchPlugin)
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })
  })

  describe('wireMapErrorLogging', () => {
    it('sends error log when err.error is present', () => {
      const mapInstance = { on: vi.fn() }

      wireMapErrorLogging(mapInstance, 'Boundary map error')

      const errorHandler = mapInstance.on.mock.calls[0][1]
      errorHandler({ error: new Error('tile load failed') })

      expect(mapInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/browser-logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Boundary map error')
        })
      )
    })

    it('falls back to the event object when err.error is missing', () => {
      const mapInstance = { on: vi.fn() }

      wireMapErrorLogging(mapInstance, 'Boundary map error')

      const errorHandler = mapInstance.on.mock.calls[0][1]
      errorHandler({ message: 'something went wrong' })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/browser-logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Boundary map error')
        })
      )
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

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/browser-logs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Custom map error')
        })
      )
    })
  })
})
