// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BOUNDARY_ACTION_SAVE } from './constants.js'
import {
  buildBoundaryInfoPanelHtml,
  registerBoundaryInfoSaveHandler,
  renderBoundaryPanel
} from './boundary-info-view.js'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('boundary-info-view', () => {
  it('builds panel html with defaults', () => {
    const html = buildBoundaryInfoPanelHtml('map-1')
    expect(html).toContain('data-map-element-id="map-1"')
    expect(html).toContain('Draw a boundary to validate it.')
    expect(html).toContain('Not available')
  })

  it('renders panel with results and enables save when continuation is allowed', () => {
    document.body.innerHTML = buildBoundaryInfoPanelHtml('map-2')

    renderBoundaryPanel('map-2', {
      summary: 'Boundary validation passed.',
      results: {
        isValid: true,
        bounds: [1, 2, 3, 4],
        intersectingEdps: ['EDP 1']
      },
      canContinue: true
    })

    const panel = document.querySelector('[data-map-element-id="map-2"]')
    const summary = panel.querySelector('[data-boundary-info-summary]')
    const saveButton = panel.querySelector(
      `[data-boundary-action="${BOUNDARY_ACTION_SAVE}"]`
    )
    const listItems = panel.querySelectorAll('li')

    expect(summary.textContent).toContain('Boundary validation passed.')
    expect(saveButton.hidden).toBe(false)
    expect(saveButton.disabled).toBe(false)
    expect(listItems).toHaveLength(1)
  })

  it('invokes custom onSaveAndContinue callback with state', () => {
    document.body.innerHTML = buildBoundaryInfoPanelHtml('map-3')

    const onSaveAndContinue = vi.fn()
    const state = {
      activeFeature: { id: 'feature-1' },
      latestResponse: { isValid: true }
    }

    registerBoundaryInfoSaveHandler({
      mapElementId: 'map-3',
      state,
      onSaveAndContinue
    })

    const button = document.querySelector(
      '[data-map-element-id="map-3"] [data-boundary-action="save"]'
    )
    button.hidden = false
    button.disabled = false
    button.click()

    expect(onSaveAndContinue).toHaveBeenCalledWith({
      feature: { id: 'feature-1' },
      response: { isValid: true }
    })
  })

  it('POSTs geojson via fetch with csrf header when callback is not provided', async () => {
    document.body.innerHTML = buildBoundaryInfoPanelHtml('map-4')

    const mockResponse = { redirected: false }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const boundaryGeojson = {
      boundaryGeometryWgs84: { type: 'Polygon' },
      intersectingEdps: []
    }
    const state = { latestResponse: { raw: boundaryGeojson } }

    registerBoundaryInfoSaveHandler({
      mapElementId: 'map-4',
      state,
      saveAndContinueUrl: '/quote/continue',
      csrfToken: 'token-123'
    })

    const button = document.querySelector(
      '[data-map-element-id="map-4"] [data-boundary-action="save"]'
    )
    button.hidden = false
    button.disabled = false
    button.click()

    await Promise.resolve()

    expect(globalThis.fetch).toHaveBeenCalledWith('/quote/continue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'token-123'
      },
      body: JSON.stringify({ boundaryGeojson })
    })

    delete globalThis.fetch
  })

  it('redirects to response URL when fetch response is redirected', async () => {
    document.body.innerHTML = buildBoundaryInfoPanelHtml('map-5')

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ redirected: true, url: '/redirected-url' })

    const assignMock = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign: assignMock }
    })

    const state = { latestResponse: { raw: {} } }

    registerBoundaryInfoSaveHandler({
      mapElementId: 'map-5',
      state,
      saveAndContinueUrl: '/quote/continue'
    })

    const button = document.querySelector(
      '[data-map-element-id="map-5"] [data-boundary-action="save"]'
    )
    button.hidden = false
    button.disabled = false
    button.click()

    await Promise.resolve()

    expect(assignMock).toHaveBeenCalledWith('/redirected-url')

    delete globalThis.fetch
  })

  it('logs error and does not throw when fetch rejects', async () => {
    document.body.innerHTML = buildBoundaryInfoPanelHtml('map-6')

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const state = { latestResponse: { raw: {} } }

    registerBoundaryInfoSaveHandler({
      mapElementId: 'map-6',
      state,
      saveAndContinueUrl: '/quote/continue'
    })

    const button = document.querySelector(
      '[data-map-element-id="map-6"] [data-boundary-action="save"]'
    )
    button.hidden = false
    button.disabled = false
    button.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(errorSpy).toHaveBeenCalledWith(
      'submitSaveAndContinue error: Network failure'
    )

    delete globalThis.fetch
  })
})
