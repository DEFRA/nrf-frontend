// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { wireDrawControls } from './draw-controls.js'

function createMapHarness() {
  const handlers = {}
  const map = {
    on: vi.fn((eventName, callback) => {
      handlers[eventName] = callback
    }),
    addButton: vi.fn(),
    addPanel: vi.fn(),
    hidePanel: vi.fn(),
    showPanel: vi.fn(),
    fitToBounds: vi.fn(),
    emit: vi.fn()
  }

  return { map, handlers }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('draw-controls', () => {
  it('wires panel actions and event state transitions', () => {
    const { map, handlers } = createMapHarness()
    const drawPlugin = {
      newPolygon: vi.fn(),
      editFeature: vi.fn(),
      deleteFeature: vi.fn(),
      addFeature: vi.fn()
    }

    const randomUuidSpy = vi
      .spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue('feature-uuid')

    wireDrawControls(map, {
      drawPlugin,
      mapElementId: 'draw-map'
    })

    handlers['app:ready']?.()

    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    const drawButton = document.querySelector(
      '.app-draw-panel[data-map-element-id="draw-map"] [data-draw-action="draw"]'
    )
    const editButton = document.querySelector(
      '.app-draw-panel[data-map-element-id="draw-map"] [data-draw-action="edit"]'
    )
    const deleteButton = document.querySelector(
      '.app-draw-panel[data-map-element-id="draw-map"] [data-draw-action="delete"]'
    )

    handlers['draw:cancelled']?.()

    expect(drawButton.disabled).toBe(false)
    expect(editButton.disabled).toBe(true)
    expect(deleteButton.disabled).toBe(true)

    drawButton.click()
    expect(drawPlugin.newPolygon).toHaveBeenCalledWith('feature-uuid')
    expect(map.hidePanel).toHaveBeenCalledWith('draw')

    handlers['draw:created']?.({ id: 'feature-a' })
    expect(editButton.disabled).toBe(false)
    expect(deleteButton.disabled).toBe(false)

    editButton.click()
    expect(drawPlugin.editFeature).toHaveBeenCalledWith('feature-a')

    handlers['draw:updated']?.({ id: 'feature-a' })

    deleteButton.click()
    expect(drawPlugin.deleteFeature).toHaveBeenCalledWith(['feature-a'])

    handlers['draw:delete']?.({ featureIds: ['feature-a'] })
    expect(editButton.disabled).toBe(true)
    expect(deleteButton.disabled).toBe(true)

    handlers['draw:cancelled']?.({ id: 'feature-b' })
    expect(editButton.disabled).toBe(false)
    expect(deleteButton.disabled).toBe(false)

    // Ignore clicks outside the draw panel.
    const outsideAction = document.createElement('button')
    outsideAction.dataset.drawAction = 'draw'
    document.body.appendChild(outsideAction)
    outsideAction.click()

    // Pending feature id should be cleared if deleted before create event.
    drawButton.click()
    handlers['draw:delete']?.({ featureIds: ['feature-uuid'] })
    expect(editButton.disabled).toBe(false)

    randomUuidSpy.mockRestore()
  })

  it('hydrates initial feature once and falls back to timestamp id when randomUUID is unavailable', () => {
    const { map, handlers } = createMapHarness()
    const drawPlugin = {
      newPolygon: vi.fn(),
      editFeature: vi.fn(),
      deleteFeature: vi.fn(),
      addFeature: vi.fn()
    }

    const originalCrypto = globalThis.crypto
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true
    })
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(12345)

    wireDrawControls(map, {
      drawPlugin,
      mapElementId: 'hydrate-map',
      drawControlOptions: {
        initialFeature: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [0, 1],
                [0, 0]
              ]
            ]
          }
        }
      }
    })

    handlers['app:ready']?.()
    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    handlers['draw:ready']?.()
    handlers['draw:ready']?.()

    expect(drawPlugin.addFeature).toHaveBeenCalledTimes(1)
    expect(drawPlugin.addFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'boundary-12345',
        properties: {}
      })
    )
    expect(map.fitToBounds).toHaveBeenCalledTimes(1)
    expect(map.emit).toHaveBeenCalledWith(
      'draw:created',
      expect.objectContaining({ id: 'boundary-12345' })
    )

    dateNowSpy.mockRestore()
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true
    })
  })

  it('logs a warning when draw action is clicked without a draw plugin', () => {
    const { map, handlers } = createMapHarness()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    wireDrawControls(map, {
      drawPlugin: null,
      mapElementId: 'missing-plugin-map',
      drawControlOptions: {
        initialFeature: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [0, 1],
                [0, 0]
              ]
            ]
          }
        }
      }
    })

    handlers['app:ready']?.()

    const panelConfig = map.addPanel.mock.calls[0][1]
    document.body.insertAdjacentHTML('beforeend', panelConfig.html)

    const drawButton = document.querySelector(
      '.app-draw-panel[data-map-element-id="missing-plugin-map"] [data-draw-action="draw"]'
    )
    drawButton.click()
    handlers['draw:ready']?.()

    expect(warnSpy).toHaveBeenCalledWith(
      'Draw plugin not available, action ignored',
      ''
    )
    expect(map.fitToBounds).not.toHaveBeenCalled()
  })
})
