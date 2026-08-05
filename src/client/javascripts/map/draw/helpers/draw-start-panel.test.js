import { describe, expect, it, vi } from 'vitest'

import { wireDrawStartPanel } from './draw-start-panel.js'
import { createInteractiveMap } from '../test-utils/mock-draw-tools.js'

const ACTIONS_SLOT = { slot: 'actions' }

describe('wireDrawStartPanel', () => {
  it('adds a Draw button to the actions slot at every breakpoint', () => {
    const interactiveMap = createInteractiveMap()

    wireDrawStartPanel(interactiveMap, {
      startDraw: vi.fn(),
      hasExistingBoundary: false,
      getHasBoundary: () => false
    })

    expect(interactiveMap.addButton).toHaveBeenCalledWith(
      'drawStart',
      expect.objectContaining({
        label: 'Draw',
        variant: 'primary',
        mobile: ACTIONS_SLOT,
        tablet: ACTIONS_SLOT,
        desktop: ACTIONS_SLOT
      })
    )
  })

  it('shows the button when there is no existing boundary', () => {
    const interactiveMap = createInteractiveMap()

    wireDrawStartPanel(interactiveMap, {
      startDraw: vi.fn(),
      hasExistingBoundary: false,
      getHasBoundary: () => false
    })

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawStart',
      'hidden',
      false
    )
  })

  it('hides the button when an existing boundary has been loaded', () => {
    const interactiveMap = createInteractiveMap()

    wireDrawStartPanel(interactiveMap, {
      startDraw: vi.fn(),
      hasExistingBoundary: true,
      getHasBoundary: () => true
    })

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawStart',
      'hidden',
      true
    )
  })

  it('starts drawing when the button is clicked', () => {
    const interactiveMap = createInteractiveMap()
    const startDraw = vi.fn()

    wireDrawStartPanel(interactiveMap, {
      startDraw,
      hasExistingBoundary: false,
      getHasBoundary: () => false
    })
    const { onClick } = interactiveMap.addButton.mock.calls[0][1]
    onClick()

    expect(startDraw).toHaveBeenCalled()
  })

  it('hides the button while drawing and keeps it hidden once a boundary exists', () => {
    const interactiveMap = createInteractiveMap()

    wireDrawStartPanel(interactiveMap, {
      startDraw: vi.fn(),
      hasExistingBoundary: false,
      getHasBoundary: () => false
    })
    interactiveMap.toggleButtonState.mockClear()

    interactiveMap._emit('draw:started')

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawStart',
      'hidden',
      true
    )
  })

  it('shows the button again after cancelling with no existing boundary', () => {
    const interactiveMap = createInteractiveMap()

    wireDrawStartPanel(interactiveMap, {
      startDraw: vi.fn(),
      hasExistingBoundary: false,
      getHasBoundary: () => false
    })
    interactiveMap._emit('draw:started')
    interactiveMap.toggleButtonState.mockClear()

    interactiveMap._emit('draw:cancelled')

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawStart',
      'hidden',
      false
    )
  })

  it('keeps the button hidden after cancelling once a boundary exists', () => {
    const interactiveMap = createInteractiveMap()

    wireDrawStartPanel(interactiveMap, {
      startDraw: vi.fn(),
      hasExistingBoundary: false,
      getHasBoundary: () => true
    })
    interactiveMap._emit('draw:started')
    interactiveMap.toggleButtonState.mockClear()

    interactiveMap._emit('draw:cancelled')

    expect(interactiveMap.toggleButtonState).toHaveBeenCalledWith(
      'drawStart',
      'hidden',
      true
    )
  })
})
