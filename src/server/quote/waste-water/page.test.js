import { getByRole, getByLabelText, getAllByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { config } from '../../../config/config.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockCheckBoundary } from '../../../test-utils/mock-check-boundary.js'
import { boundaryGeojson } from '../../../test-utils/fixtures/boundary-geojson.js'
import { checkBoundaryPath } from '../upload-received/routes.js'
import { routePath as uploadPreviewMapPath } from '../upload-preview-map/routes.js'

vi.mock('../../common/services/boundary.js')

const backendUrl = config.get('backend').apiUrl
const mswServer = setupMswServer()

const boundaryCheckPath = checkBoundaryPath.replace('{id}', 'test-id')

const withBoundarySession = async (server) => {
  mockCheckBoundary({ geojson: boundaryGeojson })
  const cookie = await withValidQuoteSession(server, boundaryCheckPath)
  const { cookie: updatedCookie } = await submitForm({
    requestUrl: uploadPreviewMapPath,
    server,
    formData: {},
    cookie
  })
  return updatedCookie
}

describe('Waste water treatment works page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render all page elements', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Confirm which waste water treatment works will be used for this development'
    )
    expect(document.title).toBe(
      'Confirm which waste water treatment works will be used for this development - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/residential'
    )
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it("should remember the user's previous selection", async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { wasteWaterTreatmentWorks: 'not_known' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    expect(
      getByLabelText(
        document,
        "I don't know the waste water treatment works yet"
      )
    ).toBeChecked()
  })

  it('should show a validation error, after an invalid form submission', async () => {
    const { response, cookie: updatedCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    expectFieldsetError({
      document,
      errorMessage:
        'Select a waste water treatment works, or select that you do not know yet'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { wasteWaterTreatmentWorks: 'not_known' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/email')
  })

  it('should render radio options for each nearby waste water treatment works', async () => {
    mswServer.use(
      http.post(`${backendUrl}/wwtw/nearby`, () =>
        HttpResponse.json({
          nearbyWwtws: [
            { wwtwId: '101', wwtwName: 'Great Billing WRC', distanceKm: 3.2 },
            { wwtwId: '202', wwtwName: 'Letchworth WWTP', distanceKm: 7.5 }
          ]
        })
      )
    )

    const cookie = await withBoundarySession(getServer())
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    const radios = getAllByRole(document, 'radio')
    const labels = radios.map((r) =>
      document.querySelector(`label[for="${r.id}"]`).textContent.trim()
    )

    expect(labels).toContain('Great Billing WRC')
    expect(labels).toContain('Letchworth WWTP')
    expect(labels).toContain("I don't know the waste water treatment works yet")
  })
})
