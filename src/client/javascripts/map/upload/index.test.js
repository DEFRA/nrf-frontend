// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validGeojson } from '../../../../test-utils/fixtures/boundary-map-geojson.js'
import { createInteractiveMapConstructMock } from '../test-utils/interactive-map-construct-mock.js'
import { createModuleLoader } from '../test-utils/module-loader.js'
import { createMapElement } from './test-utils/create-map-element.js'
import { createMockMapInstance } from './test-utils/mock-map-instance.js'
import { configureMocks } from './test-utils/configure-mocks.js'

const MAP_ELEMENT_ID = 'boundary-map'

const mocks = vi.hoisted(() => ({
  interactiveMapConstruct: vi.fn(),
  maplibreProvider: vi.fn(),
  mapStylesPlugin: vi.fn(),
  scaleBarPlugin: vi.fn(),
  datasetsPlugin: vi.fn()
}))

vi.mock('@defra/interactive-map', () => ({
  InteractiveMap: createInteractiveMapConstructMock(
    mocks.interactiveMapConstruct
  )
}))
vi.mock('@defra/interactive-map/providers/maplibre', () => ({
  default: mocks.maplibreProvider
}))
vi.mock('@defra/interactive-map/plugins/map-styles', () => ({
  default: mocks.mapStylesPlugin
}))
vi.mock('@defra/interactive-map/plugins/scale-bar', () => ({
  default: mocks.scaleBarPlugin
}))
vi.mock('@defra/interactive-map/plugins/datasets', () => ({
  default: mocks.datasetsPlugin
}))

const { interceptDOMContentLoaded, loadModule } = createModuleLoader(
  () => import('./index.js')
)

describe('upload preview map init', () => {
  beforeEach(() => {
    document.body.innerHTML = ''

    interceptDOMContentLoaded()
  })

  it('does nothing when the map element does not exist', async () => {
    const mockDefra = configureMocks(mocks, createMockMapInstance())

    await loadModule()

    expect(mockDefra._mock).not.toHaveBeenCalled()
  })

  it('creates the map with zoom controls and the datasets and map styles plugins', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mockDefra = configureMocks(mocks, createMockMapInstance())

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      MAP_ELEMENT_ID,
      expect.objectContaining({
        behaviour: 'inline',
        mapLabel: 'Red line boundary',
        mapStyle: expect.objectContaining({ id: 'esri-tiles' }),
        center: [1.1405503, 52.7089441],
        bounds: null,
        containerHeight: '100%',
        enableZoomControls: true,
        transformRequest: expect.any(Function),
        plugins: [{ id: 'datasets' }, { id: 'mapStyles' }, { id: 'scaleBar' }]
      })
    )
    expect(mockDefra.mapStylesPlugin).toHaveBeenCalledWith({
      mapStyles: expect.arrayContaining([
        expect.objectContaining({ id: 'esri-tiles' })
      ])
    })
  })

  it('uses the centre and bounds from existing boundary metadata when present', async () => {
    createMapElement({
      existingBoundaryGeojson: validGeojson,
      existingBoundaryMetadata: {
        centre: [-1.45, 52.05],
        bounds: {
          bottomLeft: [-1.5, 52.0],
          topRight: [-1.4, 52.1]
        }
      }
    })
    const mockDefra = configureMocks(mocks, createMockMapInstance())

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      MAP_ELEMENT_ID,
      expect.objectContaining({
        center: [-1.45, 52.05],
        bounds: [-1.5, 52.0, -1.4, 52.1]
      })
    )
  })

  it('adds the boundary source and layers when the map is ready', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance()
    const mockDefra = configureMocks(mocks, mapInstance)

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).toHaveBeenCalledWith('boundary', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: validGeojson.features[0].geometry,
        properties: {}
      }
    })
    expect(mapInstance.addLayer).toHaveBeenCalledWith({
      id: 'boundary-fill',
      type: 'fill',
      source: 'boundary',
      paint: {
        'fill-color': 'rgba(212,53,28,1)',
        'fill-opacity': 0.1
      }
    })
    expect(mapInstance.addLayer).toHaveBeenCalledWith({
      id: 'boundary-line',
      type: 'line',
      source: 'boundary',
      paint: {
        'line-color': 'rgba(212,53,28,1)',
        'line-width': 2
      }
    })
  })

  it('waits for the style to finish loading before adding the boundary source', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance({ styleLoaded: false })
    const mockDefra = configureMocks(mocks, mapInstance)

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.once).toHaveBeenCalledWith(
      'styledata',
      expect.any(Function)
    )

    mapInstance.isStyleLoaded.mockReturnValue(true)
    mapInstance.once.mock.calls[0][1]()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'boundary',
      expect.objectContaining({ type: 'geojson' })
    )
  })

  it('re-checks after every styledata event until the style is actually loaded', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance({ styleLoaded: false })
    const mockDefra = configureMocks(mocks, mapInstance)

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.once).toHaveBeenCalledTimes(1)

    // Style still isn't loaded after the first 'styledata' — should re-subscribe
    mapInstance.once.mock.calls[0][1]()
    expect(mapInstance.addSource).not.toHaveBeenCalled()
    expect(mapInstance.once).toHaveBeenCalledTimes(2)

    // Now the style has finished loading
    mapInstance.isStyleLoaded.mockReturnValue(true)
    mapInstance.once.mock.calls[1][1]()

    expect(mapInstance.addSource).toHaveBeenCalledWith(
      'boundary',
      expect.objectContaining({ type: 'geojson' })
    )
  })

  it('suppresses map tile errors', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance()
    const mockDefra = configureMocks(mocks, mapInstance)

    await loadModule()
    mockDefra._triggerReady()

    const errorCall = mapInstance.on.mock.calls.find((c) => c[0] === 'error')
    expect(errorCall).toBeTruthy()
    expect(() =>
      errorCall[1]({ error: new Error('tile load failed') })
    ).not.toThrow()
  })

  it('wires fill opacity on zoom with the EDP fill layer ids', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mapInstance = createMockMapInstance()
    const mockDefra = configureMocks(mocks, mapInstance)

    await loadModule()
    mockDefra._triggerReady()

    expect(mapInstance.on).toHaveBeenCalledWith('zoomend', expect.any(Function))
    expect(mapInstance.on).toHaveBeenCalledWith('idle', expect.any(Function))
  })
})
