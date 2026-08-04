// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@defra/interactive-map/plugins/interact', () => ({
  default: vi.fn()
}))
vi.mock('@defra/interactive-map/plugins/draw-ml', () => ({ default: vi.fn() }))

import mockCreateInteractPlugin from '@defra/interactive-map/plugins/interact'
import mockCreateDrawMLPlugin from '@defra/interactive-map/plugins/draw-ml'
import { createDrawToolsPlugins, wireDrawTools } from './draw-tools.js'
import { PANEL_ROOT_ID } from './boundary-info-panel.js'
import { trackDocumentListeners } from '../../../../../test-utils/track-document-listeners.js'
import { createMapElement } from '../test-utils/create-map-element.js'
import { mountBoundaryInfoPanel } from '../test-utils/mount-boundary-info-panel.js'
import {
  createInteractiveMap,
  createInteractPlugin,
  createDrawPlugin,
  getMenuItem,
  FILL_LAYER_ID,
  STROKE_LAYER_ID
} from '../test-utils/mock-draw-tools.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'

// wireDrawTools registers a document-level click listener each time it
// runs; without removing it, later tests' clicks would still trigger
// earlier tests' closures against the (recreated) same-id panel DOM.
trackDocumentListeners()

function clickBoundaryInfoEditButton() {
  document
    .getElementById(PANEL_ROOT_ID)
    .querySelector('[data-boundary-action="edit"]')
    .click()
}

describe('createDrawToolsPlugins', () => {
  it('creates the interact and draw plugins via the imported plugin factories', () => {
    const interactPlugin = { id: 'interact' }
    const drawPlugin = { id: 'draw' }
    mockCreateInteractPlugin.mockReturnValue(interactPlugin)
    mockCreateDrawMLPlugin.mockReturnValue(drawPlugin)

    const result = createDrawToolsPlugins()

    expect(result).toEqual({ interactPlugin, drawPlugin })
    expect(mockCreateInteractPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        layers: [
          { layerId: FILL_LAYER_ID, idProperty: 'id' },
          { layerId: STROKE_LAYER_ID, idProperty: 'id' }
        ]
      })
    )
  })
})

describe('wireDrawTools', () => {
  it('enables the interact plugin and registers the drawTools button on map:ready', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()
    const interactPlugin = createInteractPlugin()
    const drawPlugin = createDrawPlugin()

    wireDrawTools(interactiveMap, {
      interactPlugin,
      drawPlugin,
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')

    expect(interactPlugin.enable).toHaveBeenCalledTimes(1)
    expect(interactiveMap.addButton).toHaveBeenCalledWith(
      'drawTools',
      expect.objectContaining({
        label: 'Draw tools',
        menuItems: expect.arrayContaining([
          expect.objectContaining({ id: 'drawPolygon' }),
          expect.objectContaining({ id: 'editFeature' }),
          expect.objectContaining({ id: 'deleteFeature' })
        ])
      })
    )
  })

  it('re-enables interaction and shows drawTools on draw:created/edited/cancelled', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()
    const interactPlugin = createInteractPlugin()

    wireDrawTools(interactiveMap, {
      interactPlugin,
      drawPlugin: createDrawPlugin(),
      mapElementId: MAP_ELEMENT_ID
    })

    interactiveMap._emit('draw:started')
    expect(interactPlugin.disable).toHaveBeenCalledTimes(1)

    interactiveMap._emit('draw:created')
    interactiveMap._emit('draw:edited')
    interactiveMap._emit('draw:cancelled')

    expect(interactPlugin.enable).toHaveBeenCalledTimes(3)
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawTools',
      'hidden',
      false
    )
  })

  it('toggles button states based on the current selection', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin: createDrawPlugin(),
      mapElementId: MAP_ELEMENT_ID
    })

    interactiveMap._emit('interact:selectionchange', {
      selectedFeatures: [{ featureId: 'f1', layerId: FILL_LAYER_ID }]
    })
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'editFeature',
      'disabled',
      false
    )
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'deleteFeature',
      'disabled',
      false
    )

    interactiveMap.toggleButtonState.mockClear()
    interactiveMap._emit('interact:selectionchange', {
      selectedFeatures: [{ featureId: 'f2', layerId: 'some-other-layer' }]
    })
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'editFeature',
      'disabled',
      true
    )
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'deleteFeature',
      'disabled',
      true
    )

    interactiveMap.toggleButtonState.mockClear()
    interactiveMap._emit('interact:selectionchange', { selectedFeatures: [] })
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawPolygon',
      'disabled',
      false
    )
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'deleteFeature',
      'disabled',
      true
    )
  })

  it('disables drawing a new polygon once a boundary exists, until it is deleted', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()
    const interactPlugin = createInteractPlugin()
    const drawPlugin = createDrawPlugin()

    wireDrawTools(interactiveMap, {
      interactPlugin,
      drawPlugin,
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')
    const panel = document.querySelector('.app-draw-start-panel')

    interactiveMap._emit('draw:created')

    expect(panel.hidden).toBe(true)
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawPolygon',
      'disabled',
      true
    )

    interactiveMap._emit('interact:selectionchange', {
      selectedFeatures: [{ featureId: 'f1', layerId: FILL_LAYER_ID }]
    })
    getMenuItem(interactiveMap, 'deleteFeature').onClick()

    expect(panel.hidden).toBe(false)
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawPolygon',
      'disabled',
      false
    )
  })

  it('starts with the drawPolygon menu item disabled when an existing boundary is passed in', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin: createDrawPlugin(),
      mapElementId: MAP_ELEMENT_ID,
      hasExistingBoundary: true
    })
    interactiveMap._emit('map:ready')

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawPolygon',
      'disabled',
      true
    )
  })

  describe('editing from the boundary info panel', () => {
    const BOUNDARY_FEATURE_ID = 'boundary-1'

    it('does nothing when there is no boundary to edit yet', () => {
      mountBoundaryInfoPanel()
      const interactiveMap = createInteractiveMap()
      const interactPlugin = createInteractPlugin()
      const drawPlugin = createDrawPlugin()

      wireDrawTools(interactiveMap, {
        interactPlugin,
        drawPlugin,
        mapElementId: MAP_ELEMENT_ID
      })

      clickBoundaryInfoEditButton()

      expect(interactPlugin.selectFeature).not.toHaveBeenCalled()
      expect(drawPlugin.editFeature).not.toHaveBeenCalled()
    })

    it('selects and edits the boundary drawn this session when the Edit button is clicked', () => {
      mountBoundaryInfoPanel()
      createMapElement()
      const interactiveMap = createInteractiveMap()
      const interactPlugin = createInteractPlugin()
      const drawPlugin = createDrawPlugin()
      drawPlugin.editFeature.mockReturnValue(true)

      wireDrawTools(interactiveMap, {
        interactPlugin,
        drawPlugin,
        mapElementId: MAP_ELEMENT_ID
      })
      interactiveMap._emit('map:ready')
      interactiveMap._emit('draw:created', { id: BOUNDARY_FEATURE_ID })

      clickBoundaryInfoEditButton()

      expect(interactPlugin.selectFeature).toHaveBeenCalledWith({
        featureId: BOUNDARY_FEATURE_ID,
        layerId: FILL_LAYER_ID,
        idProperty: 'id'
      })
      expect(drawPlugin.editFeature).toHaveBeenCalledWith(BOUNDARY_FEATURE_ID)
      expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
        'drawTools',
        'hidden',
        true
      )
      expect(interactPlugin.disable).toHaveBeenCalledTimes(1)
    })

    it('edits a boundary that was hydrated from a previous session', () => {
      mountBoundaryInfoPanel()
      const interactiveMap = createInteractiveMap()
      const interactPlugin = createInteractPlugin()
      const drawPlugin = createDrawPlugin()
      drawPlugin.editFeature.mockReturnValue(true)

      wireDrawTools(interactiveMap, {
        interactPlugin,
        drawPlugin,
        mapElementId: MAP_ELEMENT_ID,
        hasExistingBoundary: true,
        initialBoundaryFeatureId: 'saved-boundary-1'
      })

      clickBoundaryInfoEditButton()

      expect(drawPlugin.editFeature).toHaveBeenCalledWith('saved-boundary-1')
    })

    it('does not enter edit mode when editFeature fails', () => {
      mountBoundaryInfoPanel()
      const interactiveMap = createInteractiveMap()
      const interactPlugin = createInteractPlugin()
      const drawPlugin = createDrawPlugin()
      drawPlugin.editFeature.mockReturnValue(false)

      wireDrawTools(interactiveMap, {
        interactPlugin,
        drawPlugin,
        mapElementId: MAP_ELEMENT_ID,
        initialBoundaryFeatureId: BOUNDARY_FEATURE_ID
      })

      clickBoundaryInfoEditButton()

      expect(interactiveMap.toggleButtonState).not.toHaveBeenCalled()
      expect(interactPlugin.disable).not.toHaveBeenCalled()
    })

    it('forgets the boundary feature once it is deleted', () => {
      mountBoundaryInfoPanel()
      const interactiveMap = createInteractiveMap()
      const interactPlugin = createInteractPlugin()
      const drawPlugin = createDrawPlugin()
      drawPlugin.editFeature.mockReturnValue(true)

      wireDrawTools(interactiveMap, {
        interactPlugin,
        drawPlugin,
        mapElementId: MAP_ELEMENT_ID,
        initialBoundaryFeatureId: BOUNDARY_FEATURE_ID
      })
      interactiveMap._emit('draw:delete')

      clickBoundaryInfoEditButton()

      expect(drawPlugin.editFeature).not.toHaveBeenCalled()
    })

    it('ignores clicks outside the Edit button', () => {
      mountBoundaryInfoPanel()
      const interactiveMap = createInteractiveMap()
      const interactPlugin = createInteractPlugin()
      const drawPlugin = createDrawPlugin()

      wireDrawTools(interactiveMap, {
        interactPlugin,
        drawPlugin,
        mapElementId: MAP_ELEMENT_ID,
        initialBoundaryFeatureId: BOUNDARY_FEATURE_ID
      })

      document.body.click()

      expect(interactPlugin.selectFeature).not.toHaveBeenCalled()
    })
  })
})
