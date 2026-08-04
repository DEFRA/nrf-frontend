import { vi } from 'vitest'

export const FILL_LAYER_ID = 'fill-inactive.cold'
export const STROKE_LAYER_ID = 'stroke-inactive.cold'

export function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((eventType, callback) => {
      ;(handlers[eventType] ??= []).push(callback)
    }),
    addButton: vi.fn(),
    toggleButtonState: vi.fn(),
    _emit: (eventType, payload) =>
      handlers[eventType]?.forEach((handler) => handler(payload))
  }
}

export function createInteractPlugin() {
  return {
    enable: vi.fn(),
    disable: vi.fn(),
    clear: vi.fn(),
    selectFeature: vi.fn()
  }
}

export function createDrawPlugin() {
  return {
    newPolygon: vi.fn(),
    editFeature: vi.fn(),
    deleteFeature: vi.fn()
  }
}

export function getMenuItem(interactiveMap, id) {
  const call = interactiveMap.addButton.mock.calls.find(
    ([buttonId]) => buttonId === 'drawTools'
  )
  return call[1].menuItems.find((item) => item.id === id)
}
