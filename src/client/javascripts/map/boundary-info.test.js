// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { wireBoundaryInfoPanel } from './boundary-info.js'

const PANEL_ROOT_ID = 'draw-boundary-boundary-info'

// wireBoundaryInfoPanel registers a document-level click listener each time
// it runs; without removing it, later tests' clicks would still trigger
// earlier tests' closures against the (recreated) same-id panel DOM.
const documentListeners = []
const originalAddEventListener = document.addEventListener.bind(document)
document.addEventListener = (event, handler, options) => {
  documentListeners.push([event, handler, options])
  originalAddEventListener(event, handler, options)
}

function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((event, callback) => {
      handlers[event] = callback
    }),
    addPanel: vi.fn((_id, config) => {
      document.body.insertAdjacentHTML('beforeend', config.html)
    }),
    showPanel: vi.fn(),
    hidePanel: vi.fn(),
    _emit: (event, payload) => handlers[event]?.(payload)
  }
}

function wireAndReady(options = {}) {
  const interactiveMap = createInteractiveMap()
  wireBoundaryInfoPanel(interactiveMap, {
    checkUrl: '/quote/draw-boundary/check',
    saveAndContinueUrl: '/quote/draw-boundary/save',
    csrfToken: 'token-123',
    ...options
  })
  interactiveMap._emit('map:ready')
  return interactiveMap
}

function panelText(selector) {
  return document
    .getElementById(PANEL_ROOT_ID)
    .querySelector(selector)
    .textContent.trim()
}

function panelHidden(selector) {
  return document.getElementById(PANEL_ROOT_ID).querySelector(selector).hidden
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  documentListeners.splice(0).forEach(([event, handler, options]) => {
    document.removeEventListener(event, handler, options)
  })
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('wireBoundaryInfoPanel', () => {
  it('adds the boundary info panel on map:ready', () => {
    const interactiveMap = wireAndReady()

    expect(interactiveMap.addPanel).toHaveBeenCalledWith(
      'boundaryInfo',
      expect.objectContaining({ label: 'Boundary information' })
    )
    expect(document.getElementById(PANEL_ROOT_ID)).not.toBeNull()
    expect(panelText('[data-boundary-info-summary]')).toBe(
      'Draw a boundary to check it.'
    )
  })

  it('shows a checking message then valid results with intersecting EDPs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          isValid: true,
          boundaryMetadata: {
            area: { hectares: 12, acres: 30 },
            perimeter: { kilometres: 4, miles: 2.5 }
          },
          intersectingEdps: [
            { name: 'Yare Broads', code: 'EDP1' },
            'Bure Broads'
          ]
        })
    })
    vi.stubGlobal('fetch', fetchMock)

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: { type: 'Polygon' } })

    expect(interactiveMap.showPanel).toHaveBeenCalledWith('boundaryInfo')
    expect(panelText('[data-boundary-info-summary]')).toBe(
      'Checking boundary...'
    )

    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      '/quote/draw-boundary/check',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-csrf-token': 'token-123' }),
        body: JSON.stringify({ geometry: { type: 'Polygon' } })
      })
    )
    expect(panelText('[data-boundary-info-area]')).toBe('12ha (30 acres)')
    expect(panelText('[data-boundary-info-perimeter]')).toBe('4km (2.5 miles)')
    expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('Yare Broads')
    expect(items[1].textContent).toBe('Bure Broads')
  })

  it('shows "None" when there are no intersecting EDPs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ isValid: true, intersectingEdps: [] })
      })
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()

    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(1)
    expect(items[0].textContent).toBe('None')
    expect(panelText('[data-boundary-info-area]')).toBe('Not available')
  })

  it('renders the backend error message when the check request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid geometry' })
      })
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:edited', { geometry: {} })
    await flushPromises()

    expect(panelText('[data-boundary-info-error]')).toBe('Invalid geometry')
    expect(panelHidden('[data-boundary-info-error]')).toBe(false)
    expect(panelHidden('[data-boundary-info-results]')).toBe(true)
  })

  it('renders a generic error message when the check request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()

    expect(panelText('[data-boundary-info-error]')).toBe(
      'An error occurred checking the boundary'
    )
  })

  it('disables the save button while drawing starts', () => {
    const interactiveMap = wireAndReady()
    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')

    interactiveMap._emit('draw:started')

    expect(saveButton.disabled).toBe(true)
  })

  it('re-enables the save button on cancel only if a valid result exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ isValid: true })
      })
    )

    const interactiveMap = wireAndReady()
    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')

    interactiveMap._emit('draw:started')
    interactiveMap._emit('draw:cancelled')
    expect(saveButton.disabled).toBe(true)

    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()

    interactiveMap._emit('draw:started')
    interactiveMap._emit('draw:cancelled')
    expect(saveButton.disabled).toBe(false)
  })

  it('resets and hides the panel on draw:delete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ isValid: true })
      })
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()

    interactiveMap._emit('draw:delete')

    expect(interactiveMap.hidePanel).toHaveBeenCalledWith('boundaryInfo')
    expect(panelText('[data-boundary-info-summary]')).toBe(
      'Draw a boundary to check it.'
    )
    expect(panelHidden('[data-boundary-action="save"]')).toBe(true)
  })

  it('submits save and continue and follows a redirect', async () => {
    const checkFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ isValid: true })
    })
    const saveFetch = vi.fn().mockResolvedValue({
      redirected: true,
      url: '/quote/email'
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((url, options) =>
        url === '/quote/draw-boundary/save'
          ? saveFetch(url, options)
          : checkFetch(url, options)
      )
    )
    const assignMock = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign: assignMock })

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.click()
    await flushPromises()

    expect(saveFetch).toHaveBeenCalledWith(
      '/quote/draw-boundary/save',
      expect.objectContaining({ method: 'POST' })
    )
    expect(assignMock).toHaveBeenCalledWith('/quote/email')
  })

  it('re-enables the save button when the save request does not redirect', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/quote/draw-boundary/save') {
          return Promise.resolve({ redirected: false })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isValid: true })
        })
      })
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.click()
    await flushPromises()

    expect(saveButton.disabled).toBe(false)
  })

  it('re-enables the save button when the save request throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/quote/draw-boundary/save') {
          return Promise.reject(new Error('network'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ isValid: true })
        })
      })
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.click()
    await flushPromises()

    expect(saveButton.disabled).toBe(false)
  })

  it('does nothing when the save button is clicked while disabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ isValid: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await flushPromises()
    fetchMock.mockClear()

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.disabled = true
    saveButton.click()
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignores clicks outside the save button', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    wireAndReady()
    document.body.click()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not submit when there is no saved payload yet', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    wireAndReady({ saveAndContinueUrl: '/quote/draw-boundary/save' })
    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.disabled = false
    saveButton.click()

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
