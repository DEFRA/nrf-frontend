// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BOUNDARY_ACTION_SAVE } from './constants.js'
import { buildBoundaryInfoPanelHtml } from './boundary-info-view.js'
import {
  createBoundaryValidationRunner,
  registerBoundaryInfoMapEvents
} from './boundary-info-validation.js'

vi.mock('../logger/index.js', () => ({
  logger: { error: vi.fn(), info: vi.fn() }
}))

import { logger } from '../logger/index.js'

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

function buildValidGeometry() {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0]
      ]
    ]
  }
}

describe('createBoundaryValidationRunner', () => {
  beforeEach(() => {
    document.body.innerHTML = buildBoundaryInfoPanelHtml('test-map')
  })

  it('returns early when endpoint is not set', async () => {
    const state = {
      activeFeature: null,
      latestResponse: null,
      inFlightRequest: null
    }
    const map = { showPanel: vi.fn(), hidePanel: vi.fn(), on: vi.fn() }
    const requestBuilder = vi.fn()
    const runner = createBoundaryValidationRunner({
      map,
      mapElementId: 'test-map',
      state,
      endpoint: null,
      method: 'POST',
      requestBuilder,
      responseParser: vi.fn(),
      csrfToken: 'token'
    })

    await runner({ type: 'Feature' })

    expect(requestBuilder).not.toHaveBeenCalled()
  })

  it('logs an error and still fetches when geometry is invalid', async () => {
    const state = {
      activeFeature: null,
      latestResponse: null,
      inFlightRequest: null
    }
    const map = { showPanel: vi.fn(), hidePanel: vi.fn(), on: vi.fn() }
    const badGeometry = { type: 'Point', coordinates: [0, 0] }
    const requestBuilder = vi.fn(() => ({ geometry: badGeometry }))
    const responseParser = vi.fn(() => ({
      isValid: true,
      intersectingEdps: []
    }))

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ isValid: true, intersectingEdps: [] })
    })

    const runner = createBoundaryValidationRunner({
      map,
      mapElementId: 'test-map',
      state,
      endpoint: '/check-boundary',
      method: 'POST',
      requestBuilder,
      responseParser,
      csrfToken: 'token'
    })

    await runner({ type: 'Feature' })

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'draw-boundary check: invalid geometry before sending to check-boundary endpoint'
    )
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('logs an error when the response is not ok', async () => {
    const state = {
      activeFeature: null,
      latestResponse: null,
      inFlightRequest: null
    }
    const map = { showPanel: vi.fn(), hidePanel: vi.fn(), on: vi.fn() }
    const requestBuilder = vi.fn(() => ({ geometry: buildValidGeometry() }))
    const responseParser = vi.fn(() => null)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => null
    })

    const runner = createBoundaryValidationRunner({
      map,
      mapElementId: 'test-map',
      state,
      endpoint: '/check-boundary',
      method: 'POST',
      requestBuilder,
      responseParser,
      csrfToken: 'token'
    })

    await runner({ type: 'Feature' })

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Boundary validation request failed'
    )
  })

  it('logs an error and renders error panel on unexpected fetch failure', async () => {
    const state = {
      activeFeature: null,
      latestResponse: null,
      inFlightRequest: null
    }
    const map = { showPanel: vi.fn(), hidePanel: vi.fn(), on: vi.fn() }
    const requestBuilder = vi.fn(() => ({ geometry: buildValidGeometry() }))

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network failure'))

    const runner = createBoundaryValidationRunner({
      map,
      mapElementId: 'test-map',
      state,
      endpoint: '/check-boundary',
      method: 'POST',
      requestBuilder,
      responseParser: vi.fn(),
      csrfToken: 'token'
    })

    await runner({ type: 'Feature' })

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'Boundary validation request failed'
    )
  })

  it('does not log on abort', async () => {
    const state = {
      activeFeature: null,
      latestResponse: null,
      inFlightRequest: null
    }
    const map = { showPanel: vi.fn(), hidePanel: vi.fn(), on: vi.fn() }
    const requestBuilder = vi.fn(() => ({ geometry: buildValidGeometry() }))

    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    globalThis.fetch = vi.fn().mockRejectedValue(abortError)

    const runner = createBoundaryValidationRunner({
      map,
      mapElementId: 'test-map',
      state,
      endpoint: '/check-boundary',
      method: 'POST',
      requestBuilder,
      responseParser: vi.fn(),
      csrfToken: 'token'
    })

    await runner({ type: 'Feature' })

    expect(logger.error).not.toHaveBeenCalled()
  })

  it('handles non-JSON response body gracefully', async () => {
    const state = {
      activeFeature: null,
      latestResponse: null,
      inFlightRequest: null
    }
    const map = { showPanel: vi.fn(), hidePanel: vi.fn(), on: vi.fn() }
    const requestBuilder = vi.fn(() => ({ geometry: buildValidGeometry() }))
    const responseParser = vi.fn(() => ({
      isValid: true,
      intersectingEdps: []
    }))

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('not json')
      }
    })

    const runner = createBoundaryValidationRunner({
      map,
      mapElementId: 'test-map',
      state,
      endpoint: '/check-boundary',
      method: 'POST',
      requestBuilder,
      responseParser,
      csrfToken: 'token'
    })

    await runner({ type: 'Feature' })

    expect(responseParser).toHaveBeenCalledWith(null)
  })

  it('stores the normalized response on state', async () => {
    const state = {
      activeFeature: null,
      latestResponse: null,
      inFlightRequest: null
    }
    const map = { showPanel: vi.fn(), hidePanel: vi.fn(), on: vi.fn() }
    const normalized = { isValid: true, intersectingEdps: [] }
    const requestBuilder = vi.fn(() => ({ geometry: buildValidGeometry() }))
    const responseParser = vi.fn(() => normalized)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => normalized
    })

    const runner = createBoundaryValidationRunner({
      map,
      mapElementId: 'test-map',
      state,
      endpoint: '/check-boundary',
      method: 'POST',
      requestBuilder,
      responseParser,
      csrfToken: 'token'
    })

    await runner({ type: 'Feature' })

    expect(state.latestResponse).toBe(normalized)
  })
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
