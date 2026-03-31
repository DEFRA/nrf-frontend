// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  initialiseInteractiveMap,
  runWhenMapStyleReady
} from './interactive-map-base.js'

describe('interactive-map-base', () => {
  let warnSpy

  beforeEach(() => {
    document.body.innerHTML = ''
    delete globalThis.defra
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns null when map element is missing', () => {
    const result = initialiseInteractiveMap({
      mapElementId: 'missing-map',
      getMapOptions: vi.fn()
    })

    expect(result).toBeNull()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('warns when requested and map element is missing', () => {
    const result = initialiseInteractiveMap({
      mapElementId: 'missing-map',
      warnOnMissingElement: true,
      missingElementMessage: 'Boundary map element not found',
      getMapOptions: vi.fn()
    })

    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith('Boundary map element not found', '')
  })

  it('warns when interactive map dependencies are unavailable', () => {
    const element = document.createElement('div')
    element.id = 'test-map'
    document.body.appendChild(element)

    const result = initialiseInteractiveMap({
      mapElementId: 'test-map',
      getMapOptions: vi.fn()
    })

    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      'DEFRA interactive map dependencies not available',
      ''
    )
  })

  it('creates interactive map and invokes callback when configured', () => {
    const element = document.createElement('div')
    element.id = 'test-map'
    document.body.appendChild(element)

    const createdMap = { on: vi.fn() }
    const maplibreProvider = vi.fn().mockReturnValue({ provider: 'maplibre' })
    function MockInteractiveMap() {
      return createdMap
    }
    const constructorSpy = vi.fn()

    globalThis.defra = {
      maplibreProvider,
      InteractiveMap: new Proxy(MockInteractiveMap, {
        construct(target, args) {
          constructorSpy(...args)
          return createdMap
        }
      })
    }

    const getMapOptions = vi.fn(({ defraApi }) => ({
      mapProvider: defraApi.maplibreProvider(),
      mapStyle: { url: '/public/data/vts/OS_VTS_3857_Outdoor.json' }
    }))
    const onMapCreated = vi.fn()

    const result = initialiseInteractiveMap({
      mapElementId: 'test-map',
      getMapOptions,
      onMapCreated
    })

    expect(constructorSpy).toHaveBeenCalledWith(
      'test-map',
      expect.objectContaining({
        mapProvider: { provider: 'maplibre' },
        mapStyle: { url: '/public/data/vts/OS_VTS_3857_Outdoor.json' }
      })
    )
    expect(onMapCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        map: createdMap,
        mapEl: element,
        defraApi: globalThis.defra
      })
    )
    expect(result).toEqual({
      map: createdMap,
      mapEl: element,
      defraApi: globalThis.defra,
      context: undefined
    })
  })

  it('returns null when getMapOptions returns null', () => {
    const element = document.createElement('div')
    element.id = 'test-map'
    document.body.appendChild(element)

    const constructorSpy = vi.fn()
    globalThis.defra = {
      maplibreProvider: vi.fn(),
      InteractiveMap: constructorSpy
    }

    const result = initialiseInteractiveMap({
      mapElementId: 'test-map',
      getMapOptions: vi.fn().mockReturnValue(null)
    })

    expect(result).toBeNull()
    expect(constructorSpy).not.toHaveBeenCalled()
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
