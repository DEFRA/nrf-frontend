import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { routePath as emailRoutePath } from '../email/routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
const backendUrl = config.get('backend').apiUrl
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

const mswServer = setupMswServer()

describe('Check your answers page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render a page heading and submit button', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(document.title).toBe(
      'Check your answers - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your answers'
    )
    expect(
      getByRole(document, 'button', { name: 'Submit' })
    ).toBeInTheDocument()
    expect(getByRole(document, 'button', { name: 'Delete' })).toHaveAttribute(
      'href',
      '/quote/delete-quote'
    )
  })

  it('should redirect to the confirmation page if Submit is clicked', async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: emailRoutePath,
      server: getServer(),
      formData: { email: 'deidre@developers.org' },
      cookie: sessionCookie
    })
    mswServer.use(
      http.post(`${backendUrl}/quote`, () =>
        HttpResponse.json({ reference: 'NRF-123456' })
      )
    )
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: updatedCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/quote/confirmation?reference=NRF-123456'
    )
  })
})
