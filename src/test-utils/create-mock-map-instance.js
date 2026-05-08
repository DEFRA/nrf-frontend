import { vi } from 'vitest'

/**
 * @param {{ width?: number, height?: number }} [options]
 * @returns {HTMLCanvasElement}
 */
export function createCanvas({ width = 800, height = 600 } = {}) {
  const canvas = document.createElement('canvas')
  Object.defineProperty(canvas, 'offsetWidth', { value: width })
  Object.defineProperty(canvas, 'offsetHeight', { value: height })
  return canvas
}

/**
 * @param {{ zoom?: number, allCornersInsideLayer?: boolean, canvas?: HTMLCanvasElement }} [options]
 */
export function createMockMapInstance({
  zoom = 10,
  allCornersInsideLayer = false,
  canvas = createCanvas()
} = {}) {
  const handlers = {}
  return {
    on: vi.fn((eventName, callback) => {
      handlers[eventName] = callback
    }),
    once: vi.fn((eventName, callback) => {
      handlers[eventName] = callback
    }),
    getZoom: vi.fn(() => zoom),
    getCanvas: vi.fn(() => canvas),
    queryRenderedFeatures: vi.fn(() =>
      allCornersInsideLayer ? [{ type: 'Feature' }] : []
    ),
    setPaintProperty: vi.fn(),
    _handlers: handlers
  }
}
