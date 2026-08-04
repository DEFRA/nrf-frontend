// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { validGeojson } from '../../../../test-utils/fixtures/boundary-map-geojson.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { createInteractiveMapConstructMock } from '../test-utils/interactive-map-construct-mock.js'
import { createModuleLoader } from '../test-utils/module-loader.js'
import { createMapElement } from './test-utils/create-map-element.js'
import { createMockMapInstance } from './test-utils/mock-map-instance.js'
import { configureMocks } from './test-utils/configure-mocks.js'
import { PANEL_ROOT_ID } from './helpers/boundary-info-panel.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'
const CHECK_URL = `${window.location.origin}/quote/draw-boundary/check`

const mswServer = setupMswServer()

const mocks = vi.hoisted(() => ({
  interactiveMapConstruct: vi.fn(),
  maplibreProvider: vi.fn(),
  mapStylesPlugin: vi.fn(),
  scaleBarPlugin: vi.fn(),
  searchPlugin: vi.fn(),
  interactPlugin: vi.fn(),
  drawMLPlugin: vi.fn(),
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
vi.mock('@defra/interactive-map/plugins/search', () => ({
  default: mocks.searchPlugin
}))
vi.mock('@defra/interactive-map/plugins/interact', () => ({
  default: mocks.interactPlugin
}))
vi.mock('@defra/interactive-map/plugins/draw-ml', () => ({
  default: mocks.drawMLPlugin
}))
vi.mock('@defra/interactive-map/plugins/datasets', () => ({
  default: mocks.datasetsPlugin
}))

const { interceptDOMContentLoaded, loadModule } = createModuleLoader(
  () => import('./index.js')
)

describe('draw boundary map init', () => {
  beforeEach(() => {
    mswServer.use(
      http.post(CHECK_URL, () => HttpResponse.json({ isValid: true }))
    )

    interceptDOMContentLoaded()
  })

  it('does nothing when the map element does not exist', async () => {
    const mockDefra = configureMocks(mocks)

    await loadModule()

    expect(mockDefra._mock).not.toHaveBeenCalled()
  })

  it('creates the map with the expected options and plugins', async () => {
    createMapElement({ csrfToken: 'csrf-token-123' })
    const mockDefra = configureMocks(mocks)

    await loadModule()

    expect(mockDefra._mock).toHaveBeenCalledWith(
      MAP_ELEMENT_ID,
      expect.objectContaining({
        behaviour: 'inline',
        center: [1.1405503, 52.7089441],
        zoom: 8.5,
        mapStyle: expect.objectContaining({ id: 'esri-tiles' }),
        containerHeight: '100%',
        transformRequest: expect.any(Function),
        plugins: expect.arrayContaining([
          { id: 'datasets' },
          { id: 'scaleBar' },
          expect.objectContaining({ id: 'interact' }),
          expect.objectContaining({ newPolygon: expect.any(Function) }),
          { id: 'search' }
        ])
      })
    )
  })

  it('moves the styles button to the top-right slot above the zoom controls, without a label', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)

    await loadModule()

    const { plugins } = mockDefra._mock.mock.calls[0][1]
    const mapStylesConfig = plugins.find((plugin) => plugin.id === 'mapStyles')

    const topRightNoLabel = { slot: 'right-top', showLabel: false }
    expect(mapStylesConfig.manifest.buttons).toEqual([
      {
        id: 'mapStyles',
        mobile: topRightNoLabel,
        tablet: topRightNoLabel,
        desktop: topRightNoLabel
      }
    ])
  })

  it('opens the styles panel beside its button on tablet/desktop, and as a drawer on mobile', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)

    await loadModule()

    const { plugins } = mockDefra._mock.mock.calls[0][1]
    const mapStylesConfig = plugins.find((plugin) => plugin.id === 'mapStyles')

    const drawer = { slot: 'drawer', modal: true, dismissible: true }
    const besideButton = {
      slot: 'map-styles-button',
      modal: true,
      width: '400px',
      dismissible: true
    }
    expect(mapStylesConfig.manifest.panels).toEqual([
      {
        id: 'mapStyles',
        mobile: drawer,
        tablet: besideButton,
        desktop: besideButton
      }
    ])
  })

  it('suppresses map tile errors', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)
    const mapInstance = createMockMapInstance()

    await loadModule()
    mockDefra._emit('map:ready', { map: mapInstance })

    const errorCall = mapInstance.on.mock.calls.find((c) => c[0] === 'error')
    expect(errorCall).toBeTruthy()
    expect(() =>
      errorCall[1]({ error: new Error('tile load failed') })
    ).not.toThrow()
  })

  it('adds the boundary information panel when the map is ready', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)

    await loadModule()
    mockDefra._emit('map:ready', { map: createMockMapInstance() })

    expect(mockDefra._mockMap.addPanel).toHaveBeenCalledWith(
      'boundaryInfo',
      expect.objectContaining({ label: 'Boundary information' })
    )
  })

  it('adds the draw tools button when the map is ready', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)

    await loadModule()
    mockDefra._emit('map:ready', { map: createMockMapInstance() })

    expect(mockDefra._mockMap.addButton).toHaveBeenCalledWith(
      'drawTools',
      expect.objectContaining({ label: 'Draw tools' })
    )
  })

  it('adds a back button linking to the boundary type page when the map is ready', async () => {
    createMapElement({ backLinkPath: '/quote/boundary-type' })
    const mockDefra = configureMocks(mocks)

    await loadModule()
    mockDefra._emit('map:ready', { map: createMockMapInstance() })

    expect(mockDefra._mockMap.addButton).toHaveBeenCalledWith(
      'back',
      expect.objectContaining({
        label: 'Back',
        mobile: { slot: 'top-left', order: 1 },
        tablet: { slot: 'top-left', order: 1 },
        desktop: { slot: 'top-left', order: 1 },
        onClick: expect.any(Function)
      })
    )

    const { onClick } = mockDefra._mockMap.addButton.mock.calls.find(
      (call) => call[0] === 'back'
    )[1]
    vi.stubGlobal('location', { assign: vi.fn() })
    onClick()
    expect(window.location.assign).toHaveBeenCalledWith('/quote/boundary-type')
  })

  it('hydrates the initial draw feature once the draw plugin is ready, not on map:ready', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mockDefra = configureMocks(mocks)

    await loadModule()
    mockDefra._emit('map:ready', { map: createMockMapInstance() })
    const drawPlugin = mockDefra.drawMLPlugin.mock.results[0].value
    expect(drawPlugin.addFeature).not.toHaveBeenCalled()

    mockDefra._emit('draw:ready')
    expect(drawPlugin.addFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Feature',
        geometry: validGeojson.features[0].geometry
      })
    )
  })

  it('zooms the map to fit the hydrated feature', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mockDefra = configureMocks(mocks)

    await loadModule()
    mockDefra._emit('draw:ready')

    expect(mockDefra._mockMap.fitToBounds).toHaveBeenCalledTimes(1)
    const [bufferedBounds] = mockDefra._mockMap.fitToBounds.mock.calls[0]
    expect(bufferedBounds).toHaveLength(4)
    bufferedBounds.forEach((value, index) =>
      expect(value).toBeCloseTo([-1.55, 51.95, -1.35, 52.15][index])
    )
  })

  it('checks the hydrated boundary so the boundary information panel renders on load', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mockDefra = configureMocks(mocks)
    let capturedMethod
    mswServer.use(
      http.post(CHECK_URL, ({ request }) => {
        capturedMethod = request.method
        return HttpResponse.json({ isValid: true })
      })
    )

    await loadModule()
    mockDefra._emit('draw:ready')

    await vi.waitFor(() => expect(capturedMethod).toBe('POST'))
  })

  it('lets the boundary info panel Edit button edit a boundary hydrated from a previous session', async () => {
    createMapElement({ existingBoundaryGeojson: validGeojson })
    const mockDefra = configureMocks(mocks)

    await loadModule()
    mockDefra._emit('map:ready', { map: createMockMapInstance() })
    mockDefra._emit('draw:ready')
    const editButton = () =>
      document
        .getElementById(PANEL_ROOT_ID)
        .querySelector('[data-boundary-action="edit"]')
    await vi.waitFor(() => expect(editButton().hidden).toBe(false))

    editButton().click()

    const drawPlugin = mockDefra.drawMLPlugin.mock.results[0].value
    expect(drawPlugin.editFeature).toHaveBeenCalledWith(expect.any(String))
  })

  it('does not zoom the map when there is no feature to hydrate', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)

    await loadModule()
    mockDefra._emit('draw:ready')

    expect(mockDefra._mockMap.fitToBounds).not.toHaveBeenCalled()
  })

  it('wires fill opacity and layer visibility handling to the underlying map instance', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)
    const mapInstance = createMockMapInstance()

    await loadModule()
    mockDefra._emit('map:ready', { map: mapInstance })

    expect(mapInstance.on).toHaveBeenCalledWith('zoomend', expect.any(Function))
    expect(mapInstance.on).toHaveBeenCalledWith('idle', expect.any(Function))
  })

  it('resolves relative tile URLs to absolute URLs, leaving others untouched', async () => {
    createMapElement()
    const mockDefra = configureMocks(mocks)

    await loadModule()

    const options = mockDefra._mock.mock.calls[0][1]
    expect(options.transformRequest('/impact-assessor-map/tiles/x')).toEqual({
      url: `${window.location.origin}/impact-assessor-map/tiles/x`
    })
    expect(options.transformRequest('https://example.com/tile')).toEqual({
      url: 'https://example.com/tile'
    })
  })
})
