import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { getQuoteDataFromCache } from '../session-cache.js'

const backendUrl = config.get('backend').apiUrl

vi.mock('../session-cache.js')

const mswServer = setupMswServer()

describe('Check your answers page', () => {
  const getServer = setupTestServer()

  it('should render a page heading and submit button', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
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
  })

  it('should redirect to the confirmation page if Submit is clicked', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      email: 'deidre@developers.org'
    })
    mswServer.use(
      http.post(`${backendUrl}/quote`, () =>
        HttpResponse.json({ reference: 'NRF-123456' })
      )
    )
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/quote/confirmation?reference=NRF-123456'
    )
  })
})
