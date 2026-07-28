// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'

import { wireBoundaryInfoPanel } from './boundary-info.js'
import { logger } from '../../../logger/index.js'
import { setupMswServer } from '../../../../../test-utils/setup-msw-server.js'

// Node's fetch (unlike a browser's) doesn't resolve relative URLs against
// window.location, so absolute URLs are needed here for MSW to intercept them.
const CHECK_URL = 'http://localhost:3000/quote/draw-boundary/check'
const SAVE_URL = 'http://localhost:3000/quote/draw-boundary/save'
const PANEL_ROOT_ID = 'draw-boundary-boundary-info'

const mswServer = setupMswServer()

// wireBoundaryInfoPanel registers a document-level click listener each time
// it runs; without removing it, later tests' clicks would still trigger
// earlier tests' closures against the (recreated) same-id panel DOM.
const documentListeners = []
const originalAddEventListener = document.addEventListener.bind(document)
document.addEventListener = (eventType, handler, options) => {
  documentListeners.push([eventType, handler, options])
  originalAddEventListener(eventType, handler, options)
}

function createInteractiveMap() {
  const handlers = {}
  return {
    on: vi.fn((eventType, callback) => {
      handlers[eventType] = callback
    }),
    addPanel: vi.fn((_id, config) => {
      document.body.insertAdjacentHTML('beforeend', config.html)
    }),
    showPanel: vi.fn(),
    hidePanel: vi.fn(),
    _emit: (eventType, payload) => handlers[eventType]?.(payload)
  }
}

function wireAndReady(options = {}) {
  const interactiveMap = createInteractiveMap()
  const api = wireBoundaryInfoPanel(interactiveMap, {
    checkUrl: CHECK_URL,
    saveAndContinueUrl: SAVE_URL,
    csrfToken: 'token-123',
    ...options
  })
  interactiveMap._emit('map:ready')
  interactiveMap.checkExistingBoundary = api.checkExistingBoundary
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

afterEach(() => {
  documentListeners.splice(0).forEach(([eventType, handler, options]) => {
    document.removeEventListener(eventType, handler, options)
  })
  document.body.innerHTML = ''
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
    let capturedRequest
    mswServer.use(
      http.post(CHECK_URL, async ({ request }) => {
        capturedRequest = {
          method: request.method,
          csrfToken: request.headers.get('x-csrf-token'),
          body: await request.json()
        }
        return HttpResponse.json({
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
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: { type: 'Polygon' } })

    expect(interactiveMap.showPanel).toHaveBeenCalledWith('boundaryInfo')
    expect(panelText('[data-boundary-info-summary]')).toBe(
      'Checking boundary...'
    )

    await vi.waitFor(() =>
      expect(panelText('[data-boundary-info-area]')).toBe('12ha (30 acres)')
    )

    expect(capturedRequest).toEqual({
      method: 'POST',
      csrfToken: 'token-123',
      body: { geometry: { type: 'Polygon' } }
    })
    expect(panelText('[data-boundary-info-perimeter]')).toBe('4km (2.5 miles)')
    expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('Yare Broads')
    expect(items[1].textContent).toBe('Bure Broads')
  })

  it('logs and treats the response as empty when the check response body is not valid JSON', async () => {
    mswServer.use(http.post(CHECK_URL, () => new HttpResponse('not json')))
    const loggerErrorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => {})

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })

    await vi.waitFor(() =>
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to parse JSON response'
      )
    )
    expect(panelHidden('[data-boundary-info-results]')).toBe(true)
  })

  it('checks an existing boundary on demand, e.g. when hydrated on page load', async () => {
    let capturedBody
    mswServer.use(
      http.post(CHECK_URL, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ isValid: true, intersectingEdps: [] })
      })
    )

    const interactiveMap = wireAndReady()
    interactiveMap.checkExistingBoundary({ geometry: { type: 'Polygon' } })

    expect(interactiveMap.showPanel).toHaveBeenCalledWith('boundaryInfo')
    await vi.waitFor(() =>
      expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    )

    expect(capturedBody).toEqual({ geometry: { type: 'Polygon' } })
  })

  it('shows "None" when there are no intersecting EDPs', async () => {
    mswServer.use(
      http.post(CHECK_URL, () =>
        HttpResponse.json({ isValid: true, intersectingEdps: [] })
      )
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })

    await vi.waitFor(() =>
      expect(
        document
          .getElementById(PANEL_ROOT_ID)
          .querySelectorAll('[data-boundary-info-intersections] li')
      ).toHaveLength(1)
    )

    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items[0].textContent).toBe('None')
    expect(panelText('[data-boundary-info-area]')).toBe('Not available')
  })

  it('renders the backend error message when the check request fails', async () => {
    mswServer.use(
      http.post(CHECK_URL, () =>
        HttpResponse.json({ error: 'Invalid geometry' }, { status: 400 })
      )
    )
    const loggerErrorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => {})

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:edited', { geometry: {} })

    await vi.waitFor(() =>
      expect(panelText('[data-boundary-info-error]')).toBe('Invalid geometry')
    )

    expect(panelHidden('[data-boundary-info-error]')).toBe(false)
    expect(panelHidden('[data-boundary-info-results]')).toBe(true)
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.any(Error),
      `POST to ${CHECK_URL} returned a non-OK response`
    )
  })

  it('renders a generic error message when the check request throws', async () => {
    mswServer.use(http.post(CHECK_URL, () => HttpResponse.error()))
    const loggerErrorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => {})

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })

    await vi.waitFor(() =>
      expect(panelText('[data-boundary-info-error]')).toBe(
        'An error occurred checking the boundary'
      )
    )

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.any(Error),
      `Failed to POST to ${CHECK_URL}`
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
    mswServer.use(
      http.post(CHECK_URL, () => HttpResponse.json({ isValid: true }))
    )

    const interactiveMap = wireAndReady()
    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')

    interactiveMap._emit('draw:started')
    interactiveMap._emit('draw:cancelled')
    expect(saveButton.disabled).toBe(true)

    interactiveMap._emit('draw:created', { geometry: {} })
    await vi.waitFor(() =>
      expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    )

    interactiveMap._emit('draw:started')
    interactiveMap._emit('draw:cancelled')
    expect(saveButton.disabled).toBe(false)
  })

  it('resets and hides the panel on draw:delete', async () => {
    mswServer.use(
      http.post(CHECK_URL, () => HttpResponse.json({ isValid: true }))
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await vi.waitFor(() =>
      expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    )

    interactiveMap._emit('draw:delete')

    expect(interactiveMap.hidePanel).toHaveBeenCalledWith('boundaryInfo')
    expect(panelHidden('[data-boundary-info-summary]')).toBe(true)
    expect(panelHidden('[data-boundary-action="save"]')).toBe(true)
  })

  it('submits save and continue and follows a redirect', async () => {
    mswServer.use(
      http.post(CHECK_URL, () => HttpResponse.json({ isValid: true })),
      http.post(SAVE_URL, () =>
        HttpResponse.redirect('http://localhost:3000/quote/email', 303)
      ),
      http.get(
        'http://localhost:3000/quote/email',
        () => new HttpResponse(null)
      )
    )
    const assignMock = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign: assignMock })

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await vi.waitFor(() =>
      expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    )

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.click()

    await vi.waitFor(() => expect(assignMock).toHaveBeenCalled())
    expect(assignMock).toHaveBeenCalledWith(
      expect.stringContaining('/quote/email')
    )
  })

  it('re-enables the save button when the save request does not redirect', async () => {
    mswServer.use(
      http.post(CHECK_URL, () => HttpResponse.json({ isValid: true })),
      http.post(SAVE_URL, () => HttpResponse.json({}, { status: 500 }))
    )
    const loggerErrorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => {})

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await vi.waitFor(() =>
      expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    )

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.click()

    await vi.waitFor(() =>
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        `POST to ${SAVE_URL} returned a non-OK response`
      )
    )
    expect(saveButton.disabled).toBe(false)
  })

  it('re-enables the save button when the save request throws', async () => {
    mswServer.use(
      http.post(CHECK_URL, () => HttpResponse.json({ isValid: true })),
      http.post(SAVE_URL, () => HttpResponse.error())
    )
    const loggerErrorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => {})

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await vi.waitFor(() =>
      expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    )

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.click()

    await vi.waitFor(() =>
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        `Failed to POST to ${SAVE_URL}`
      )
    )
    expect(saveButton.disabled).toBe(false)
  })

  it('does nothing when the save button is clicked while disabled', async () => {
    let saveWasCalled = false
    mswServer.use(
      http.post(CHECK_URL, () => HttpResponse.json({ isValid: true })),
      http.post(SAVE_URL, () => {
        saveWasCalled = true
        return HttpResponse.json({})
      })
    )

    const interactiveMap = wireAndReady()
    interactiveMap._emit('draw:created', { geometry: {} })
    await vi.waitFor(() =>
      expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    )

    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.disabled = true
    saveButton.click()

    expect(saveWasCalled).toBe(false)
  })

  it('ignores clicks outside the save button', () => {
    let saveWasCalled = false
    mswServer.use(
      http.post(SAVE_URL, () => {
        saveWasCalled = true
        return HttpResponse.json({})
      })
    )

    wireAndReady()
    document.body.click()

    expect(saveWasCalled).toBe(false)
  })

  it('does not submit when there is no saved payload yet', () => {
    let saveWasCalled = false
    mswServer.use(
      http.post(SAVE_URL, () => {
        saveWasCalled = true
        return HttpResponse.json({})
      })
    )

    wireAndReady()
    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')
    saveButton.disabled = false
    saveButton.click()

    expect(saveWasCalled).toBe(false)
  })
})
