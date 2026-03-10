import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { getQuoteDataFromCache } from '../session-cache.js'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'

vi.mock('../session-cache.js')
vi.mock('../../common/services/nrf-backend.js')

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

  it('should redirect to the next placeholder page if Submit is clicked', async () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      email: 'deidre@developers.org'
    })
    vi.mocked(postRequestToBackend).mockResolvedValue({
      payload: { reference: 'NRF-123456' }
    })
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/next?reference=NRF-123456')
  })
})
