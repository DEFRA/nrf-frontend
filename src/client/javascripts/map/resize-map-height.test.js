// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getContainerHeight, wireResizeMapHeight } from './resize-map-height.js'

function createMapElement(top) {
  const el = document.createElement('div')
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top })
  document.body.appendChild(el)
  return el
}

describe('getContainerHeight', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('fills the available height below the map element', () => {
    vi.stubGlobal('innerHeight', 900)
    const mapEl = createMapElement(100)

    expect(getContainerHeight(mapEl)).toBe('784px')
  })

  it('does not go below the minimum container height', () => {
    vi.stubGlobal('innerHeight', 400)
    const mapEl = createMapElement(300)

    expect(getContainerHeight(mapEl)).toBe('320px')
  })
})

describe('wireResizeMapHeight', () => {
  let addEventListenerSpy

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('applies the recalculated height to the map element on window resize', () => {
    vi.stubGlobal('innerHeight', 900)
    const mapEl = createMapElement(100)

    wireResizeMapHeight(mapEl)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    )

    vi.stubGlobal('innerHeight', 600)
    const [, resizeHandler] = addEventListenerSpy.mock.calls.find(
      ([event]) => event === 'resize'
    )
    resizeHandler()

    expect(mapEl.style.height).toBe('484px')
  })
})
