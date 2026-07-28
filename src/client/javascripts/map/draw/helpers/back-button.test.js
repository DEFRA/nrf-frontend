// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { wireBackButton } from './back-button.js'

function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((eventType, callback) => {
      handlers[eventType] = callback
    }),
    addButton: vi.fn(),
    _emit: (eventType, payload) => handlers[eventType]?.(payload)
  }
}

describe('wireBackButton', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { assign: vi.fn() })
  })

  it('does nothing before map:ready has fired', () => {
    const interactiveMap = createInteractiveMap()
    wireBackButton(interactiveMap, { backLinkPath: '/quote/boundary-type' })

    expect(interactiveMap.addButton).not.toHaveBeenCalled()
  })

  it('adds a back button to the top-left slot, before the search control', () => {
    const interactiveMap = createInteractiveMap()
    wireBackButton(interactiveMap, { backLinkPath: '/quote/boundary-type' })

    interactiveMap._emit('map:ready')

    expect(interactiveMap.addButton).toHaveBeenCalledWith(
      'back',
      expect.objectContaining({
        label: 'Back',
        iconSvgContent: expect.stringContaining('<path'),
        mobile: { slot: 'top-left', order: 1 },
        tablet: { slot: 'top-left', order: 1 },
        desktop: { slot: 'top-left', order: 1 }
      })
    )
  })

  it('navigates to the back link path when clicked', () => {
    const interactiveMap = createInteractiveMap()
    wireBackButton(interactiveMap, { backLinkPath: '/quote/boundary-type' })

    interactiveMap._emit('map:ready')
    const { onClick } = interactiveMap.addButton.mock.calls[0][1]
    onClick()

    expect(window.location.assign).toHaveBeenCalledWith('/quote/boundary-type')
  })
})
