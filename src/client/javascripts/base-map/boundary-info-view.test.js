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
    expect(html).toContain('role="status"')
  })

  it('renders panel with results, announces status, and focuses heading', () => {
    document.body.innerHTML = `
      <div id="test-panel-boundary-info">
        <h2>Boundary information</h2>
        ${buildBoundaryInfoPanelHtml('map-2')}
      </div>`

    const panel = document.querySelector('[data-map-element-id="map-2"]')
    const headingEl = document.querySelector('#test-panel-boundary-info h2')
    const focusSpy = vi.spyOn(headingEl, 'focus')

    renderBoundaryPanel('map-2', {
      summary: '',
      announce: 'Boundary is valid',
      focusHeading: true,
      results: {
        isValid: true,
        area: { hectares: 3897.19, acres: 9630.2 },
        perimeter: { kilometres: 29.26, miles: 18.18 },
        intersectingEdps: ['EDP 1']
      },
      canContinue: true
    })

    const summary = panel.querySelector('[data-boundary-info-summary]')
    const statusEl = panel.querySelector('[data-boundary-info-status]')
    const saveButton = panel.querySelector(
      `[data-boundary-action="${BOUNDARY_ACTION_SAVE}"]`
    )
    const listItems = panel.querySelectorAll('li')
    const edpsEl = panel.querySelector('[data-boundary-info-edps]')

    expect(summary.hidden).toBe(true)
    expect(statusEl.textContent).toBe('Boundary is valid')
    expect(focusSpy).toHaveBeenCalled()
    expect(saveButton.hidden).toBe(false)
    expect(saveButton.disabled).toBe(false)
    expect(listItems).toHaveLength(1)
    expect(edpsEl.hidden).toBe(false)
    expect(panel.querySelector('[data-boundary-info-area]').textContent).toBe(
      '3897.19ha (9630.2acres)'
    )
    expect(
      panel.querySelector('[data-boundary-info-perimeter]').textContent
    ).toBe('29.26km (18.18mi)')
  })

  it('announces status without focusing heading when focusHeading is not set', () => {
    document.body.innerHTML = `
      <div id="test-panel-boundary-info">
        <h2>Boundary information</h2>
        ${buildBoundaryInfoPanelHtml('map-2b')}
      </div>`

    const headingEl = document.querySelector('#test-panel-boundary-info h2')
    const focusSpy = vi.spyOn(headingEl, 'focus')

    renderBoundaryPanel('map-2b', {
      summary: 'Checking boundary...',
      announce: 'Checking boundary'
    })

    const panel = document.querySelector('[data-map-element-id="map-2b"]')
    expect(panel.querySelector('[data-boundary-info-status]').textContent).toBe(
      'Checking boundary'
    )
    expect(focusSpy).not.toHaveBeenCalled()
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
