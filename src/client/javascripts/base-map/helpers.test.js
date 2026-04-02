// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDefraApi,
  logWarning,
  parseDatasetJson,
  runWhenMapStyleReady
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
})
