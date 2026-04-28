// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BOUNDARY_ACTION_SAVE } from './constants.js'
import { buildBoundaryInfoPanelHtml } from './boundary-info-view.js'
import { registerBoundaryInfoMapEvents } from './boundary-info-validation.js'

function buildDrawPanelHtmlForTest(mapElementId) {
  return `
    <div class="app-draw-panel" data-map-element-id="${mapElementId}">
      <button data-draw-action="edit" type="button">Edit</button>
    </div>
  `
}

function createMapHarness() {
  const handlers = {}
  const map = {
    on: vi.fn((eventName, callback) => {
      handlers[eventName] = callback
    }),
    showPanel: vi.fn(),
    hidePanel: vi.fn()
  }
  return { map, handlers }
}

function renderPanels(mapElementId) {
  document.body.innerHTML =
    buildDrawPanelHtmlForTest(mapElementId) +
    buildBoundaryInfoPanelHtml(mapElementId)
}

function getSaveButton(mapElementId) {
  return document.querySelector(
    `.app-boundary-info-panel[data-map-element-id="${mapElementId}"] [data-boundary-action="${BOUNDARY_ACTION_SAVE}"]`
  )
}

function getEditButton(mapElementId) {
  return document.querySelector(
    `.app-draw-panel[data-map-element-id="${mapElementId}"] [data-draw-action="edit"]`
  )
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('registerBoundaryInfoMapEvents - edit mode button state', () => {
  it('disables Save and continue when the Edit button is clicked', () => {
    renderPanels('map-edit')
    const saveButton = getSaveButton('map-edit')
    saveButton.disabled = false

    const { map } = createMapHarness()
    registerBoundaryInfoMapEvents({
      map,
      state: { activeFeature: null, latestResponse: null },
      runValidation: vi.fn(),
      mapElementId: 'map-edit'
    })

    getEditButton('map-edit').click()

    expect(saveButton.disabled).toBe(true)
  })

  it('ignores Edit clicks from other maps', () => {
    document.body.innerHTML =
      buildDrawPanelHtmlForTest('map-a') +
      buildBoundaryInfoPanelHtml('map-a') +
      buildDrawPanelHtmlForTest('map-b') +
      buildBoundaryInfoPanelHtml('map-b')

    const saveButtonA = getSaveButton('map-a')
    saveButtonA.disabled = false

    const { map } = createMapHarness()
    registerBoundaryInfoMapEvents({
      map,
      state: { activeFeature: null, latestResponse: null },
      runValidation: vi.fn(),
      mapElementId: 'map-a'
    })

    getEditButton('map-b').click()

    expect(saveButtonA.disabled).toBe(false)
  })

  it('does nothing when a disabled Edit button is clicked', () => {
    renderPanels('map-edit-disabled')
    const saveButton = getSaveButton('map-edit-disabled')
    saveButton.disabled = false

    const editButton = getEditButton('map-edit-disabled')
    editButton.disabled = true

    const { map } = createMapHarness()
    registerBoundaryInfoMapEvents({
      map,
      state: { activeFeature: null, latestResponse: null },
      runValidation: vi.fn(),
      mapElementId: 'map-edit-disabled'
    })

    editButton.click()

    expect(saveButton.disabled).toBe(false)
  })

  it('re-enables Save and continue on draw:cancelled when last validation was valid', () => {
    renderPanels('map-cancel')
    const saveButton = getSaveButton('map-cancel')
    saveButton.disabled = true

    const { map, handlers } = createMapHarness()
    registerBoundaryInfoMapEvents({
      map,
      state: {
        activeFeature: null,
        latestResponse: { isValid: true }
      },
      runValidation: vi.fn(),
      mapElementId: 'map-cancel'
    })

    handlers['draw:cancelled']?.()

    expect(saveButton.disabled).toBe(false)
  })

  it('leaves Save and continue disabled on draw:cancelled when last validation was invalid', () => {
    renderPanels('map-cancel-invalid')
    const saveButton = getSaveButton('map-cancel-invalid')
    saveButton.disabled = true

    const { map, handlers } = createMapHarness()
    registerBoundaryInfoMapEvents({
      map,
      state: {
        activeFeature: null,
        latestResponse: { isValid: false }
      },
      runValidation: vi.fn(),
      mapElementId: 'map-cancel-invalid'
    })

    handlers['draw:cancelled']?.()

    expect(saveButton.disabled).toBe(true)
  })

  it('leaves Save and continue disabled on draw:cancelled when there is no prior validation', () => {
    renderPanels('map-cancel-none')
    const saveButton = getSaveButton('map-cancel-none')
    saveButton.disabled = true

    const { map, handlers } = createMapHarness()
    registerBoundaryInfoMapEvents({
      map,
      state: { activeFeature: null, latestResponse: null },
      runValidation: vi.fn(),
      mapElementId: 'map-cancel-none'
    })

    handlers['draw:cancelled']?.()

    expect(saveButton.disabled).toBe(true)
  })
})
