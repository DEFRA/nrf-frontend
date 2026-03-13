import { JSDOM } from 'jsdom'
import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { checkBoundary } from '../../common/services/boundary.js'
import { checkBoundaryPath } from '../upload-received/routes.js'

vi.mock('../../common/services/boundary.js')

const mockGeojson = {
  geometry: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0]
            ]
          ]
        },
        properties: {}
      }
    ]
  },
  intersecting_edps: [],
  intersects_edp: false
}

async function setupSession(server) {
  const sessionCookie = await withValidQuoteSession(server)
  vi.mocked(checkBoundary).mockResolvedValue({ geojson: mockGeojson })
  const { cookie } = await submitForm({
    requestUrl: checkBoundaryPath.replace('{id}', 'test-upload-id'),
    server,
    formData: {},
    cookie: sessionCookie
  })
  return cookie
}

async function loadPageWithSession(server) {
  const cookie = await setupSession(server)
  const response = await server.inject({
    method: 'GET',
    url: routePath,
    headers: cookie ? { cookie } : {}
  })
  const { window } = new JSDOM(response.result)
  return { document: window.document, cookie }
}

describe('Check boundary result page', () => {
  const getServer = setupTestServer()

  it('should render all page elements', async () => {
    const { document } = await loadPageWithSession(getServer())

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your boundary'
    )
    expect(document.title).toBe(
      'Check your boundary - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/upload-boundary'
    )
    expect(getByLabelText(document, 'Yes, continue')).not.toBeChecked()
    expect(
      getByLabelText(document, 'No, upload a different file')
    ).not.toBeChecked()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it('should display feature count', async () => {
    const { document } = await loadPageWithSession(getServer())

    const body = document.querySelector('.govuk-body')
    expect(body.textContent).toContain('1 feature found')
  })

  it('should redirect to upload-boundary when no geojson in session', async () => {
    const sessionCookie = await withValidQuoteSession(getServer())
    const response = await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie: sessionCookie }
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/quote/upload-boundary')
  })

  it('should show a validation error after submitting without a selection', async () => {
    const cookie = await setupSession(getServer())
    const { response, cookie: postCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: postCookie
    })
    expectFieldsetError({
      document,
      errorMessage: 'Select if the boundary is correct'
    })
  })

  it('should redirect to development-types when user confirms', async () => {
    const cookie = await setupSession(getServer())
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryCorrect: 'yes' },
      cookie
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/quote/development-types')
  })

  it('should redirect to upload-boundary when user selects no', async () => {
    const cookie = await setupSession(getServer())
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { boundaryCorrect: 'no' },
      cookie
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/quote/upload-boundary')
  })
})
