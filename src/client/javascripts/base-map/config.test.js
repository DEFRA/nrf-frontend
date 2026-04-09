// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createMap, getMapStyles, getStyleControlsManifest } from './config.js'

afterEach(() => {
  delete globalThis.defra
  document.body.innerHTML = ''
})

describe('base-map config', () => {
  describe('getMapStyles', () => {
    it('returns all four style definitions with attribution', () => {
      expect(getMapStyles()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'esri-tiles' }),
          expect.objectContaining({ id: 'outdoor-os' }),
          expect.objectContaining({ id: 'dark' }),
          expect.objectContaining({ id: 'black-and-white' })
        ])
      )
      expect(getMapStyles()[0]).toEqual(
        expect.objectContaining({
          attribution: expect.stringContaining('Ordnance Survey')
        })
      )
    })
  })

  describe('createMap', () => {
    it('returns null when map element not found', () => {
      expect(createMap({ mapElementId: 'non-existent' })).toBeNull()
    })

    it('returns null when defraApi not available', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      expect(createMap({ mapElementId: 'test-map' })).toBeNull()
    })

    it('creates InteractiveMap with mapStyles and mapStyle set to first style', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      const mockMap = {}
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return mockMap
          }
        }),
        maplibreProvider: vi.fn()
      }

      const result = createMap({ mapElementId: 'test-map' })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          minZoom: 4,
          bounds: [-5.75, 49.95, 1.8, 55.85],
          maxBounds: [-5.75, 49.95, 1.8, 55.85],
          mapStyle: expect.objectContaining({ id: 'esri-tiles' }),
          mapStyles: expect.arrayContaining([
            expect.objectContaining({ id: 'esri-tiles' }),
            expect.objectContaining({ id: 'outdoor-os' })
          ])
        })
      )
      expect(result).toBe(mockMap)
    })

    it('merges additional options into the map options', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn()
      }

      createMap({
        mapElementId: 'test-map',
        mapLabel: 'My map',
        containerHeight: '400px',
        options: { bounds: [-8.75, 49.8, 2.1, 60.95] }
      })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          mapLabel: 'My map',
          containerHeight: '400px',
          bounds: [-8.75, 49.8, 2.1, 60.95]
        })
      )
    })

    it('supports legacy string signature for createMap', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap('test-map', {
        bounds: [-8.75, 49.8, 2.1, 60.95],
        maxBounds: [-8.75, 49.8, 2.1, 60.95]
      })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          bounds: [-8.75, 49.8, 2.1, 60.95],
          maxBounds: [-8.75, 49.8, 2.1, 60.95]
        })
      )
    })

    it('supports containerHeight resolver function', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      const containerHeight = vi.fn().mockReturnValue('320px')

      createMap({ mapElementId: 'test-map', containerHeight })

      expect(containerHeight).toHaveBeenCalledWith(el)
      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({ containerHeight: '320px' })
      )
    })

    it('adds style controls plugin when showStyleControls is true', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      const mapStylesPlugin = vi.fn().mockReturnValue({ id: 'mapStyles' })
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({}),
        mapStylesPlugin
      }

      createMap({ mapElementId: 'test-map', showStyleControls: true })

      expect(mapStylesPlugin).toHaveBeenCalledWith(
        expect.objectContaining({
          mapStyles: expect.any(Array),
          manifest: getStyleControlsManifest()
        })
      )
      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          plugins: [expect.objectContaining({ id: 'mapStyles' })]
        })
      )
    })

    it('does not add plugins when style controls requested but plugin unavailable', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map', showStyleControls: true })

      const options = constructorSpy.mock.calls[0][1]
      expect(options.plugins).toBeUndefined()
    })

    it('preserves existing plugins when style controls are disabled', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      const customPlugin = { id: 'custom-plugin' }
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({
        mapElementId: 'test-map',
        options: { plugins: [customPlugin] }
      })

      expect(constructorSpy).toHaveBeenCalledWith(
        'test-map',
        expect.objectContaining({
          plugins: [customPlugin]
        })
      )
    })

    it('wires draw controls when showDrawControls is true', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const addButton = vi.fn()
      const addPanel = vi.fn()
      const map = {
        on: vi.fn((eventName, callback) => {
          if (eventName === 'app:ready') {
            callback()
          }
        }),
        addButton,
        addPanel
      }

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map', showDrawControls: true })

      expect(map.on).toHaveBeenCalledWith('app:ready', expect.any(Function))
      expect(addButton).toHaveBeenCalledWith(
        'draw',
        expect.objectContaining({
          panelId: 'draw',
          mobile: expect.objectContaining({ slot: 'top-left' }),
          desktop: expect.objectContaining({ slot: 'top-left' })
        })
      )
      expect(addPanel).toHaveBeenCalledWith(
        'draw',
        expect.objectContaining({
          tablet: expect.objectContaining({ slot: 'left-bottom' }),
          desktop: expect.objectContaining({ slot: 'left-bottom' })
        })
      )
    })

    it('does not wire draw controls when showDrawControls is false', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const map = {
        on: vi.fn(),
        addButton: vi.fn(),
        addPanel: vi.fn()
      }

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      expect(map.on).not.toHaveBeenCalledWith('app:ready', expect.any(Function))
      expect(map.addButton).not.toHaveBeenCalled()
      expect(map.addPanel).not.toHaveBeenCalled()
    })

    it('allows only one drawn feature and enables edit only after create event', () => {
      const el = document.createElement('div')
      el.id = 'draw-test-map'
      document.body.appendChild(el)

      const eventHandlers = {}
      const addButton = vi.fn()
      const addPanel = vi.fn()
      const hidePanel = vi.fn()
      const showPanel = vi.fn()
      const map = {
        on: vi.fn((eventName, callback) => {
          eventHandlers[eventName] = callback
        }),
        addButton,
        addPanel,
        hidePanel,
        showPanel
      }

      const drawPluginInstance = {
        id: 'draw',
        newPolygon: vi.fn(),
        editFeature: vi.fn(),
        deleteFeature: vi.fn()
      }

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({}),
        drawMLPlugin: vi.fn().mockReturnValue(drawPluginInstance)
      }

      createMap({ mapElementId: 'draw-test-map', showDrawControls: true })

      eventHandlers['app:ready']?.()

      const panelOptions = addPanel.mock.calls.find(
        (call) => call[0] === 'draw'
      )?.[1]
      document.body.insertAdjacentHTML('beforeend', panelOptions.html)

      const drawButton = document.querySelector(
        '.app-draw-panel[data-map-element-id="draw-test-map"] [data-draw-action="draw"]'
      )
      const editButton = document.querySelector(
        '.app-draw-panel[data-map-element-id="draw-test-map"] [data-draw-action="edit"]'
      )
      const deleteButton = document.querySelector(
        '.app-draw-panel[data-map-element-id="draw-test-map"] [data-draw-action="delete"]'
      )

      eventHandlers['draw:cancelled']?.()

      expect(drawButton.disabled).toBe(false)
      expect(editButton.disabled).toBe(true)
      expect(deleteButton.disabled).toBe(true)

      drawButton.click()

      expect(drawPluginInstance.newPolygon).toHaveBeenCalledWith(
        expect.any(String)
      )
      expect(hidePanel).toHaveBeenCalledWith('draw')
      expect(drawPluginInstance.deleteFeature).not.toHaveBeenCalled()
      expect(drawButton.disabled).toBe(true)
      expect(editButton.disabled).toBe(true)
      expect(deleteButton.disabled).toBe(true)

      eventHandlers['draw:created']?.({ id: 'feature-1' })

      expect(showPanel).toHaveBeenCalledWith('draw')
      expect(drawButton.disabled).toBe(true)
      expect(editButton.disabled).toBe(false)
      expect(deleteButton.disabled).toBe(false)

      editButton.click()
      expect(drawPluginInstance.editFeature).toHaveBeenCalledWith('feature-1')

      // User deletes the feature — plugin fires back draw:delete
      deleteButton.click()
      expect(drawPluginInstance.deleteFeature).toHaveBeenCalledWith([
        'feature-1'
      ])
      eventHandlers['draw:delete']?.({ featureIds: ['feature-1'] })

      // Draw is re-enabled, Edit/Delete disabled
      expect(drawButton.disabled).toBe(false)
      expect(editButton.disabled).toBe(true)
      expect(deleteButton.disabled).toBe(true)

      // User can draw again — no existing feature to delete first
      drawButton.click()
      expect(drawPluginInstance.deleteFeature).toHaveBeenCalledTimes(1)
      expect(drawPluginInstance.newPolygon).toHaveBeenCalledTimes(2)
      expect(drawButton.disabled).toBe(true)
      expect(editButton.disabled).toBe(true)
      expect(deleteButton.disabled).toBe(true)
    })

    it('disables draw and enables edit/delete when an initial feature is provided', () => {
      const el = document.createElement('div')
      el.id = 'draw-test-map-with-feature'
      document.body.appendChild(el)

      const eventHandlers = {}
      const addPanel = vi.fn()
      const map = {
        on: vi.fn((eventName, callback) => {
          eventHandlers[eventName] = callback
        }),
        addButton: vi.fn(),
        addPanel,
        showPanel: vi.fn(),
        hidePanel: vi.fn(),
        emit: vi.fn(),
        fitToBounds: vi.fn()
      }

      const drawPluginInstance = {
        id: 'draw',
        addFeature: vi.fn(),
        newPolygon: vi.fn(),
        editFeature: vi.fn(),
        deleteFeature: vi.fn()
      }

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({}),
        drawMLPlugin: vi.fn().mockReturnValue(drawPluginInstance)
      }

      const initialFeature = {
        id: 'restored-feature-1',
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-1.32, 51.85],
              [-1.34, 51.84],
              [-1.33, 51.83],
              [-1.29, 51.84],
              [-1.32, 51.85]
            ]
          ]
        },
        properties: {}
      }

      createMap({
        mapElementId: 'draw-test-map-with-feature',
        showDrawControls: true,
        drawControlOptions: { initialFeature }
      })

      eventHandlers['app:ready']?.()

      const panelOptions = addPanel.mock.calls.find(
        (call) => call[0] === 'draw'
      )?.[1]
      document.body.insertAdjacentHTML('beforeend', panelOptions.html)

      eventHandlers['draw:ready']?.()

      const drawButton = document.querySelector(
        '.app-draw-panel[data-map-element-id="draw-test-map-with-feature"] [data-draw-action="draw"]'
      )
      const editButton = document.querySelector(
        '.app-draw-panel[data-map-element-id="draw-test-map-with-feature"] [data-draw-action="edit"]'
      )
      const deleteButton = document.querySelector(
        '.app-draw-panel[data-map-element-id="draw-test-map-with-feature"] [data-draw-action="delete"]'
      )

      expect(drawPluginInstance.addFeature).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'restored-feature-1' })
      )
      expect(drawButton.disabled).toBe(true)
      expect(editButton.disabled).toBe(false)
      expect(deleteButton.disabled).toBe(false)

      expect(map.showPanel).toHaveBeenCalledWith('draw')

      expect(map.fitToBounds).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'restored-feature-1' })
      )

      expect(map.emit).toHaveBeenCalledWith(
        'draw:created',
        expect.objectContaining({ id: 'restored-feature-1' })
      )
    })

    it('wires map instance error logging when mapErrorMessage is provided', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const mapInstance = { on: vi.fn() }
      const map = { on: vi.fn() }
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({
        mapElementId: 'test-map',
        mapErrorMessage: 'Boundary map error'
      })

      const readyCallback = map.on.mock.calls.find(
        (c) => c[0] === 'map:ready'
      )?.[1]
      readyCallback({ map: mapInstance })

      expect(map.on).toHaveBeenCalledWith('map:ready', expect.any(Function))
      expect(mapInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('wires boundary info panel and calls backend validation after draw completion', async () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const eventHandlers = {}
      const addPanel = vi.fn()
      const map = {
        on: vi.fn((eventName, callback) => {
          eventHandlers[eventName] = callback
        }),
        addPanel,
        showPanel: vi.fn(),
        hidePanel: vi.fn()
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          boundaryGeometryOriginal: {
            type: 'Polygon',
            coordinates: [
              [
                [446984.8350803522, 218060.65868001332],
                [445151.49580266274, 216124.85255242622],
                [446505.8686390488, 214697.44179239718],
                [449072.8167334427, 216147.02397569863],
                [446984.8350803522, 218060.65868001332]
              ]
            ]
          },
          boundaryGeometryWgs84: {
            type: 'Polygon',
            coordinates: [
              [
                [-1.3191546171725879, 51.85916129554659],
                [-1.3460261914845242, 51.84190872189816],
                [-1.3265601691618827, 51.82896495118416],
                [-1.289109234889739, 51.84177799534028],
                [-1.3191546171725879, 51.85916129554659]
              ]
            ]
          },
          intersectingEdps: [
            { name: 'South Oxford', code: 'EDP-001' },
            { name: 'North Oxford', code: 'EDP-002' }
          ]
        })
      })

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({
        mapElementId: 'test-map',
        showBoundaryInfoPanel: true,
        boundaryInfoOptions: { endpoint: '/boundary/validate' }
      })

      eventHandlers['app:ready']?.()

      const panelOptions = addPanel.mock.calls.find(
        (call) => call[0] === 'boundary-info'
      )?.[1]

      expect(panelOptions).toEqual(
        expect.objectContaining({
          desktop: expect.objectContaining({ slot: 'right-bottom' })
        })
      )

      document.body.insertAdjacentHTML('beforeend', panelOptions.html)

      const feature = {
        id: 'feature-1',
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {}
      }

      eventHandlers['draw:created']?.(feature)
      await Promise.resolve()
      await Promise.resolve()

      expect(map.showPanel).toHaveBeenCalledWith('boundary-info')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/boundary/validate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ geojson: feature })
        })
      )

      const saveButton = document.querySelector(
        '.app-boundary-info-panel[data-map-element-id="test-map"] [data-boundary-action="save"]'
      )
      expect(saveButton.hidden).toBe(false)
      expect(saveButton.disabled).toBe(true)

      const panelRoot = document.querySelector(
        '.app-boundary-info-panel[data-map-element-id="test-map"]'
      )
      expect(
        panelRoot.querySelector('[data-boundary-info-bounds]').textContent
      ).toBe('-1.346026, 51.828965, -1.289109, 51.859161')
      const intersectionItems = panelRoot.querySelectorAll(
        '[data-boundary-info-intersections] li'
      )
      expect(intersectionItems).toHaveLength(2)
      expect(intersectionItems[0].textContent).toBe('South Oxford (EDP-001)')
      expect(intersectionItems[1].textContent).toBe('North Oxford (EDP-002)')

      delete globalThis.fetch
    })

    it('shows backend validation error and renders invalid details from 400 payload', async () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const eventHandlers = {}
      const addPanel = vi.fn()
      const map = {
        on: vi.fn((eventName, callback) => {
          eventHandlers[eventName] = callback
        }),
        addPanel,
        showPanel: vi.fn(),
        hidePanel: vi.fn()
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error:
            'The uploaded boundary contains invalid geometry (self-intersecting or crossing line segments). Please correct the boundary so that edges do not cross each other and try again.',
          geojson: {
            error:
              'The uploaded boundary contains invalid geometry (self-intersecting or crossing line segments). Please correct the boundary so that edges do not cross each other and try again.',
            boundaryGeometryWgs84: {
              type: 'FeatureCollection',
              features: [
                {
                  id: '0',
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [-1.309421606013502, 51.84737512928018],
                        [-1.3210589019773957, 51.83744003546812],
                        [-1.296303199670799, 51.82959499153737],
                        [-1.2884744732936881, 51.83927034907504],
                        [-1.3161923963990685, 51.82920270346567],
                        [-1.309421606013502, 51.84737512928018]
                      ]
                    ]
                  }
                }
              ]
            }
          }
        })
      })

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({
        mapElementId: 'test-map',
        showBoundaryInfoPanel: true,
        boundaryInfoOptions: { endpoint: '/boundary/validate' }
      })

      eventHandlers['app:ready']?.()

      const panelOptions = addPanel.mock.calls.find(
        (call) => call[0] === 'boundary-info'
      )?.[1]
      document.body.insertAdjacentHTML('beforeend', panelOptions.html)

      const feature = {
        id: 'feature-2',
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {}
      }

      eventHandlers['draw:created']?.(feature)
      await Promise.resolve()
      await Promise.resolve()

      const panelRoot = document.querySelector(
        '.app-boundary-info-panel[data-map-element-id="test-map"]'
      )

      expect(
        panelRoot.querySelector('[data-boundary-info-summary]').textContent
      ).toBe('Boundary validation failed.')
      expect(
        panelRoot.querySelector('[data-boundary-info-error]').textContent
      ).toContain('invalid geometry')
      expect(
        panelRoot.querySelector('[data-boundary-info-bounds]').textContent
      ).toBe('-1.321059, 51.829203, -1.288474, 51.847375')
      expect(
        panelRoot.querySelector('[data-boundary-info-intersections]')
          .textContent
      ).toBe('Not available')

      const saveButton = panelRoot.querySelector(
        '[data-boundary-action="save"]'
      )
      expect(saveButton.hidden).toBe(true)

      delete globalThis.fetch
    })

    it('submits save and continue as a POST form with csrf token', async () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const eventHandlers = {}
      const addPanel = vi.fn()
      const map = {
        on: vi.fn((eventName, callback) => {
          eventHandlers[eventName] = callback
        }),
        addPanel,
        showPanel: vi.fn(),
        hidePanel: vi.fn()
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          boundaryGeometryWgs84: {
            type: 'Polygon',
            coordinates: [
              [
                [-1.3191546171725879, 51.85916129554659],
                [-1.3460261914845242, 51.84190872189816],
                [-1.3265601691618827, 51.82896495118416],
                [-1.289109234889739, 51.84177799534028],
                [-1.3191546171725879, 51.85916129554659]
              ]
            ]
          },
          intersectingEdps: [{ name: 'South Oxford', code: 'EDP-001' }]
        })
      })

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      const submitSpy = vi
        .spyOn(globalThis.HTMLFormElement.prototype, 'submit')
        .mockImplementation(() => {})

      createMap({
        mapElementId: 'test-map',
        showBoundaryInfoPanel: true,
        boundaryInfoOptions: {
          endpoint: '/boundary/validate',
          saveAndContinueUrl: '/quote/draw-boundary/save',
          csrfToken: 'csrf-token-123'
        }
      })

      eventHandlers['app:ready']?.()

      const panelOptions = addPanel.mock.calls.find(
        (call) => call[0] === 'boundary-info'
      )?.[1]
      document.body.insertAdjacentHTML('beforeend', panelOptions.html)

      const feature = {
        id: 'feature-3',
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {}
      }

      eventHandlers['draw:created']?.(feature)
      await Promise.resolve()
      await Promise.resolve()

      const saveButton = document.querySelector(
        '.app-boundary-info-panel[data-map-element-id="test-map"] [data-boundary-action="save"]'
      )
      saveButton.click()

      expect(submitSpy).toHaveBeenCalledTimes(1)

      const saveForm = document.querySelector(
        'form[action="/quote/draw-boundary/save"]'
      )
      expect(saveForm).toBeTruthy()
      expect(saveForm.method).toBe('post')

      const csrfInput = saveForm.querySelector('input[name="csrfToken"]')
      expect(csrfInput).toBeTruthy()
      expect(csrfInput.value).toBe('csrf-token-123')

      submitSpy.mockRestore()
      delete globalThis.fetch
    })

    it('wires layer controls with legend swatches and style-aware layer paints', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const eventHandlers = {}
      const addButton = vi.fn()
      const addPanel = vi.fn()
      const mapEventHandlers = {}
      const mapInstance = {
        getStyle: vi
          .fn()
          .mockReturnValue({ sprite: '/public/data/vts/OS_VTS_3857_Dark' }),
        getSource: vi.fn().mockReturnValue(null),
        addSource: vi.fn(),
        getLayer: vi.fn().mockReturnValue(null),
        addLayer: vi.fn(),
        setPaintProperty: vi.fn(),
        setLayoutProperty: vi.fn(),
        on: vi.fn((eventName, callback) => {
          mapEventHandlers[eventName] = callback
        })
      }
      const map = {
        on: vi.fn((eventName, callback) => {
          eventHandlers[eventName] = callback
        }),
        addButton,
        addPanel
      }

      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct() {
            return map
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({
        mapElementId: 'test-map',
        showLayerControls: true,
        layerControlOptions: {
          layers: [
            {
              label: 'EDP boundaries',
              sourceId: 'edp-boundaries-tiles',
              sourceLayer: 'edp_boundaries',
              tilesUrl:
                '/impact-assessor-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt',
              fillColor: '#00703c',
              lineColor: '#00703c',
              paintByStyle: {
                dark: {
                  fillColor: '#9ddfa6',
                  lineColor: '#9ddfa6'
                }
              },
              defaultVisible: true
            },
            {
              label: 'LPA boundaries',
              sourceId: 'lpa-boundaries-tiles',
              sourceLayer: 'lpa_boundaries',
              tilesUrl:
                '/impact-assessor-map/tiles/lpa_boundaries/{z}/{x}/{y}.mvt',
              fillColor: '#1d70b8',
              lineColor: '#1d70b8',
              defaultVisible: false
            }
          ]
        }
      })

      eventHandlers['app:ready']?.()
      const panelOptions = addPanel.mock.calls.find(
        (call) => call[0] === 'layers'
      )?.[1]
      document.body.insertAdjacentHTML('beforeend', panelOptions.html)

      eventHandlers['map:ready']?.({ map: mapInstance })

      expect(addButton).toHaveBeenCalledWith(
        'layers',
        expect.objectContaining({ panelId: 'layers' })
      )
      expect(addPanel).toHaveBeenCalledWith(
        'layers',
        expect.objectContaining({
          desktop: expect.objectContaining({ slot: 'left-top' })
        })
      )
      expect(mapInstance.addSource).toHaveBeenCalledWith(
        'edp-boundaries-tiles',
        expect.objectContaining({
          type: 'vector',
          tiles: ['/impact-assessor-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt']
        })
      )
      expect(mapInstance.addSource).toHaveBeenCalledWith(
        'lpa-boundaries-tiles',
        expect.objectContaining({
          type: 'vector',
          tiles: ['/impact-assessor-map/tiles/lpa_boundaries/{z}/{x}/{y}.mvt']
        })
      )

      mapInstance.getLayer.mockReturnValue({})

      const toggles = document.querySelectorAll(
        '.app-layers-panel[data-map-element-id="test-map"] [data-layer-action="toggle-layer"]'
      )
      expect(toggles).toHaveLength(2)

      const swatches = document.querySelectorAll(
        '.app-layers-panel[data-map-element-id="test-map"] [data-layer-legend-swatch]'
      )
      expect(swatches).toHaveLength(2)
      expect(swatches[0].style.backgroundColor).toBeTruthy()

      const edpToggle = document.querySelector(
        '.app-layers-panel[data-map-element-id="test-map"] [data-layer-id="edp-boundaries-tiles"]'
      )
      expect(edpToggle.checked).toBe(true)

      const lpaToggle = document.querySelector(
        '.app-layers-panel[data-map-element-id="test-map"] [data-layer-id="lpa-boundaries-tiles"]'
      )
      lpaToggle.checked = true
      lpaToggle.dispatchEvent(new Event('change', { bubbles: true }))

      expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
        'lpa-boundaries-tiles-fill',
        'visibility',
        'visible'
      )
      expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
        'lpa-boundaries-tiles-line',
        'visibility',
        'visible'
      )

      expect(mapInstance.setLayoutProperty).toHaveBeenCalledWith(
        'edp-boundaries-tiles-fill',
        'visibility',
        'visible'
      )

      mapInstance.getLayer.mockReturnValue({})
      mapEventHandlers.styledata?.()

      expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
        'edp-boundaries-tiles-fill',
        'fill-color',
        '#9ddfa6'
      )
      expect(mapInstance.setPaintProperty).toHaveBeenCalledWith(
        'edp-boundaries-tiles-line',
        'line-color',
        '#9ddfa6'
      )
    })

    it('adds transformRequest hook that resolves root-relative URLs', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      const transformed = options.transformRequest(
        '/public/data/vts/style.json'
      )

      expect(transformed).toEqual({
        url: `${globalThis.location.origin}/public/data/vts/style.json`
      })
    })

    it('adds transformStyle hook that normalizes style asset URLs', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      const style = {
        sprite: '/sprite',
        glyphs: '/fonts/{fontstack}/{range}.pbf',
        sources: {
          vts: {
            type: 'vector',
            url: '/public/data/vts/source.json',
            tiles: ['/public/data/vts/{z}/{x}/{y}.pbf', 'https://cdn.example/a']
          }
        }
      }

      const normalized = options.transformStyle(null, style)

      expect(normalized.sprite).toBe(`${globalThis.location.origin}/sprite`)
      expect(normalized.glyphs).toBe(
        `${globalThis.location.origin}/fonts/{fontstack}/{range}.pbf`
      )
      expect(normalized.sources.vts.url).toBe(
        `${globalThis.location.origin}/public/data/vts/source.json`
      )
      expect(normalized.sources.vts.tiles).toEqual([
        `${globalThis.location.origin}/public/data/vts/{z}/{x}/{y}.pbf`,
        'https://cdn.example/a'
      ])
    })

    it('keeps absolute URLs unchanged in transformRequest and transformStyle', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      expect(
        options.transformRequest('https://example.com/style.json')
      ).toEqual({
        url: 'https://example.com/style.json'
      })

      const style = {
        sprite: 'https://example.com/sprite',
        glyphs: 'https://example.com/fonts/{fontstack}/{range}.pbf',
        sources: {
          vts: {
            type: 'vector',
            url: 'https://example.com/source.json',
            tiles: ['https://example.com/{z}/{x}/{y}.pbf']
          }
        }
      }

      const normalized = options.transformStyle(null, style)

      expect(normalized).toEqual(style)
    })

    it('returns style unchanged when transformStyle receives non-object', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      expect(options.transformStyle(null, null)).toBeNull()
      expect(options.transformStyle(null, 'not-an-object')).toBe(
        'not-an-object'
      )
    })

    it('handles source definitions with non-array tiles', () => {
      const el = document.createElement('div')
      el.id = 'test-map'
      document.body.appendChild(el)

      const constructorSpy = vi.fn()
      globalThis.defra = {
        InteractiveMap: new Proxy(function () {}, {
          construct(target, args) {
            constructorSpy(...args)
            return {}
          }
        }),
        maplibreProvider: vi.fn().mockReturnValue({})
      }

      createMap({ mapElementId: 'test-map' })

      const options = constructorSpy.mock.calls[0][1]
      const style = {
        sprite: '/sprite',
        glyphs: '/glyphs',
        sources: {
          raster: {
            type: 'raster',
            url: '/source.json',
            tiles: '/single-tile-url'
          }
        }
      }

      const normalized = options.transformStyle(null, style)

      expect(normalized.sources.raster.url).toBe(
        `${globalThis.location.origin}/source.json`
      )
      expect(normalized.sources.raster.tiles).toBe('/single-tile-url')
    })
  })
})
