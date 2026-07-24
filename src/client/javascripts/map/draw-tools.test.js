// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDrawToolsPlugins, wireDrawTools } from './draw-tools.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'

function createMapElement() {
  const el = document.createElement('div')
  el.id = MAP_ELEMENT_ID
  document.body.appendChild(el)
  return el
}

function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((event, callback) => {
      handlers[event] = callback
    }),
    addButton: vi.fn(),
    toggleButtonState: vi.fn(),
    _emit: (event, payload) => handlers[event]?.(payload)
  }
}

function createInteractPlugin() {
  return { enable: vi.fn(), disable: vi.fn(), clear: vi.fn() }
}

function createDrawPlugin() {
  return {
    newPolygon: vi.fn(),
    editFeature: vi.fn(),
    deleteFeature: vi.fn()
  }
}

function getMenuItem(interactiveMap, id) {
  const call = interactiveMap.addButton.mock.calls.find(
    ([buttonId]) => buttonId === 'drawTools'
  )
  return call[1].menuItems.find((item) => item.id === id)
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  delete globalThis.defra
})

describe('createDrawToolsPlugins', () => {
  it('creates the interact and draw plugins via window.defra', () => {
    const interactPlugin = { id: 'interact' }
    const drawPlugin = { id: 'draw' }
    globalThis.defra = {
      interactPlugin: vi.fn().mockReturnValue(interactPlugin),
      drawMLPlugin: vi.fn().mockReturnValue(drawPlugin)
    }

    const result = createDrawToolsPlugins()

    expect(result).toEqual({ interactPlugin, drawPlugin })
    expect(globalThis.defra.interactPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        layers: [
          { layerId: 'fill-inactive.cold', idProperty: 'id' },
          { layerId: 'stroke-inactive.cold', idProperty: 'id' }
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

  it('adds a visible Draw start panel to the map element when there is no existing boundary', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin: createDrawPlugin(),
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')

    const panel = document.querySelector('.app-draw-start-panel')
    expect(panel).not.toBeNull()
    expect(panel.hidden).toBe(false)
    const button = panel.querySelector('button')
    expect(button.textContent).toBe('Draw')
  })

  it('adds a hidden Draw start panel when an existing boundary has been loaded', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin: createDrawPlugin(),
      mapElementId: MAP_ELEMENT_ID,
      hasExistingBoundary: true
    })
    interactiveMap._emit('map:ready')

    const panel = document.querySelector('.app-draw-start-panel')
    expect(panel).not.toBeNull()
    expect(panel.hidden).toBe(true)
  })

  it('does not add a Draw start panel when the map element is missing', () => {
    const interactiveMap = createInteractiveMap()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin: createDrawPlugin(),
      mapElementId: 'missing-element'
    })
    interactiveMap._emit('map:ready')

    expect(document.querySelector('.app-draw-start-panel')).toBeNull()
  })

  it('hides the Draw start panel while drawing and shows it again afterwards', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin: createDrawPlugin(),
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')
    const panel = document.querySelector('.app-draw-start-panel')

    interactiveMap._emit('draw:started')
    expect(panel.hidden).toBe(true)

    interactiveMap._emit('draw:created')
    expect(panel.hidden).toBe(false)

    interactiveMap._emit('draw:started')
    interactiveMap._emit('draw:edited')
    expect(panel.hidden).toBe(false)

    interactiveMap._emit('draw:started')
    interactiveMap._emit('draw:cancelled')
    expect(panel.hidden).toBe(false)
  })

  it('starts drawing a polygon when the Draw button is clicked', () => {
    createMapElement()
    const interactiveMap = createInteractiveMap()
    const drawPlugin = createDrawPlugin()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin,
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')

    const button = document.querySelector('.app-draw-start-panel button')
    button.click()

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawTools',
      'hidden',
      true
    )
    expect(drawPlugin.newPolygon).toHaveBeenCalledWith(expect.any(String))
  })

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
      selectedFeatures: [{ featureId: 'f1', layerId: 'fill-inactive.cold' }]
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
    const panel = document.querySelector('.app-draw-start-panel')

    interactiveMap._emit('interact:selectionchange', {
      selectedFeatures: [{ featureId: 'f1', layerId: 'fill-inactive.cold' }]
    })
    getMenuItem(interactiveMap, 'editFeature').onClick()

    expect(panel.hidden).toBe(true)

    interactiveMap._emit('draw:edited')
    expect(panel.hidden).toBe(false)
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
        { featureId: 'f1', layerId: 'fill-inactive.cold' },
        { featureId: 'f2', layerId: 'stroke-inactive.cold' }
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
      selectedFeatures: [{ featureId: 'f1', layerId: 'fill-inactive.cold' }]
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
})
