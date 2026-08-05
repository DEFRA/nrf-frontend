// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('@defra/interactive-map/plugins/interact', () => ({
  default: vi.fn()
}))
vi.mock('@defra/interactive-map/plugins/draw-ml', () => ({ default: vi.fn() }))

import { wireDrawTools } from './draw-tools.js'
import { trackDocumentListeners } from '../../../../../test-utils/track-document-listeners.js'
import { createMapElement } from '../test-utils/create-map-element.js'
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

describe('draw tools menu', () => {
  it('starts drawing a polygon from the drawPolygon menu item', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()
    const drawPlugin = createDrawPlugin()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin,
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')

    getMenuItem(interactiveMap, 'drawPolygon').onClick()

    expect(drawPlugin.newPolygon).toHaveBeenCalledWith(expect.any(String))
  })

  it('does nothing further when editFeature has no feature to edit', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()
    const interactPlugin = createInteractPlugin()
    const drawPlugin = createDrawPlugin()
    drawPlugin.editFeature.mockReturnValue(false)

    wireDrawTools(interactiveMap, {
      interactPlugin,
      drawPlugin,
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')
    interactiveMap.toggleButtonState.mockClear()

    getMenuItem(interactiveMap, 'editFeature').onClick()

    expect(interactiveMap.toggleButtonState).not.toHaveBeenCalled()
    expect(interactPlugin.disable).not.toHaveBeenCalled()
  })

  it('enters edit mode when editFeature succeeds', () => {
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

    interactiveMap._emit('interact:selectionchange', {
      selectedFeatures: [{ featureId: 'f1', layerId: FILL_LAYER_ID }]
    })

    getMenuItem(interactiveMap, 'editFeature').onClick()

    expect(drawPlugin.editFeature).toHaveBeenCalledWith('f1')
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawTools',
      'hidden',
      true
    )
    expect(interactPlugin.disable).toHaveBeenCalledTimes(1)
  })

  it('hides the Draw start panel when entering edit mode', () => {
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

    interactiveMap._emit('interact:selectionchange', {
      selectedFeatures: [{ featureId: 'f1', layerId: FILL_LAYER_ID }]
    })
    getMenuItem(interactiveMap, 'editFeature').onClick()

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawStart',
      'hidden',
      true
    )

    interactiveMap.toggleButtonState.mockClear()
    interactiveMap._emit('draw:edited')
    expect(interactiveMap.toggleButtonState).not.toHaveBeenCalledWith(
      'drawStart',
      'hidden',
      false
    )
  })

  it('deletes the selected features', () => {
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
    interactiveMap._emit('interact:selectionchange', {
      selectedFeatures: [
        { featureId: 'f1', layerId: FILL_LAYER_ID },
        { featureId: 'f2', layerId: STROKE_LAYER_ID }
      ]
    })

    getMenuItem(interactiveMap, 'deleteFeature').onClick()

    expect(drawPlugin.deleteFeature).toHaveBeenCalledWith(['f1', 'f2'])
    expect(interactPlugin.clear).toHaveBeenCalledTimes(1)
    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawTools',
      'hidden',
      false
    )
  })
})
