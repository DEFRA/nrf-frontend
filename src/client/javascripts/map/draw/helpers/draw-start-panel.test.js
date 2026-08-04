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
  createDrawPlugin
} from '../test-utils/mock-draw-tools.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'

// wireDrawTools registers a document-level click listener each time it
// runs; without removing it, later tests' clicks would still trigger
// earlier tests' closures against the (recreated) same-id panel DOM.
trackDocumentListeners()

describe('draw start panel', () => {
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

  it('hides the Draw start panel while drawing and keeps it hidden once a boundary exists', () => {
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
    expect(panel.hidden).toBe(true)

    interactiveMap._emit('draw:started')
    interactiveMap._emit('draw:edited')
    expect(panel.hidden).toBe(true)
  })

  it('shows the Draw start panel again after cancelling with no existing boundary', () => {
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

  it('refocuses the map viewport after starting a polygon from the Draw button', async () => {
    const mapElement = createMapElement()
    const viewport = document.createElement('div')
    viewport.setAttribute('role', 'application')
    viewport.tabIndex = 0
    mapElement.appendChild(viewport)
    const interactiveMap = createInteractiveMap()

    wireDrawTools(interactiveMap, {
      interactPlugin: createInteractPlugin(),
      drawPlugin: createDrawPlugin(),
      mapElementId: MAP_ELEMENT_ID
    })
    interactiveMap._emit('map:ready')

    document.querySelector('.app-draw-start-panel button').click()
    await new Promise((resolve) => window.requestAnimationFrame(resolve))

    expect(document.activeElement).toBe(viewport)
  })
})
