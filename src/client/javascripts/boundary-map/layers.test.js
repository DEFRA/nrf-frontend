// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import {
  addBoundaryLayer,
  addEdpBoundaryLayer,
  addEdpIntersectionLayer
} from './layers.js'
import {
  validGeojson,
  validEdpBoundaryGeojson,
  validEdpIntersectionGeojson,
  emptyGeojson
} from '../__fixtures__/boundary-map-fixtures.js'

function createMockMapInstance() {
  return {
    getSource: vi.fn().mockReturnValue(null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    fitBounds: vi.fn()
  }
}

describe('addBoundaryLayer', () => {
  it('adds source and two layers', () => {
    const mapInstance = createMockMapInstance()
    addBoundaryLayer(mapInstance, validGeojson)

    expect(mapInstance.addSource).toHaveBeenCalledWith('boundary', {
      type: 'geojson',
      data: validGeojson
    })
    expect(mapInstance.addLayer).toHaveBeenCalledTimes(2)
    expect(mapInstance.fitBounds).toHaveBeenCalled()
  })

  it('skips if source already exists', () => {
    const mapInstance = createMockMapInstance()
    mapInstance.getSource.mockReturnValue({})
    addBoundaryLayer(mapInstance, validGeojson)

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.addLayer).not.toHaveBeenCalled()
  })
})

describe('addEdpBoundaryLayer', () => {
  it('adds source and two layers', () => {
    const mapInstance = createMockMapInstance()
    addEdpBoundaryLayer(mapInstance, validEdpBoundaryGeojson)

    expect(mapInstance.addSource).toHaveBeenCalledWith('edp-boundary', {
      type: 'geojson',
      data: validEdpBoundaryGeojson
    })
    expect(mapInstance.addLayer).toHaveBeenCalledTimes(2)
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'edp-boundary-fill',
        source: 'edp-boundary'
      })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'edp-boundary-line',
        source: 'edp-boundary'
      })
    )
  })

  it('skips when features array is empty', () => {
    const mapInstance = createMockMapInstance()
    addEdpBoundaryLayer(mapInstance, emptyGeojson)

    expect(mapInstance.addSource).not.toHaveBeenCalled()
  })

  it('skips when geojson is null', () => {
    const mapInstance = createMockMapInstance()
    addEdpBoundaryLayer(mapInstance, null)

    expect(mapInstance.addSource).not.toHaveBeenCalled()
  })

  it('skips if source already exists', () => {
    const mapInstance = createMockMapInstance()
    mapInstance.getSource.mockReturnValue({})
    addEdpBoundaryLayer(mapInstance, validEdpBoundaryGeojson)

    expect(mapInstance.addSource).not.toHaveBeenCalled()
  })
})

describe('addEdpIntersectionLayer', () => {
  it('adds source and two layers', () => {
    const mapInstance = createMockMapInstance()
    addEdpIntersectionLayer(mapInstance, validEdpIntersectionGeojson)

    expect(mapInstance.addSource).toHaveBeenCalledWith('edp-intersection', {
      type: 'geojson',
      data: validEdpIntersectionGeojson
    })
    expect(mapInstance.addLayer).toHaveBeenCalledTimes(2)
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'edp-intersection-fill',
        source: 'edp-intersection'
      })
    )
    expect(mapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'edp-intersection-line',
        source: 'edp-intersection'
      })
    )
  })

  it('skips when features array is empty', () => {
    const mapInstance = createMockMapInstance()
    addEdpIntersectionLayer(mapInstance, emptyGeojson)

    expect(mapInstance.addSource).not.toHaveBeenCalled()
  })

  it('skips when geojson is null', () => {
    const mapInstance = createMockMapInstance()
    addEdpIntersectionLayer(mapInstance, null)

    expect(mapInstance.addSource).not.toHaveBeenCalled()
  })

  it('skips if source already exists', () => {
    const mapInstance = createMockMapInstance()
    mapInstance.getSource.mockReturnValue({})
    addEdpIntersectionLayer(mapInstance, validEdpIntersectionGeojson)

    expect(mapInstance.addSource).not.toHaveBeenCalled()
  })
})
