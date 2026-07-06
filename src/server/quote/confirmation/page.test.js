import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { mockGetQuote } from '../../../test-utils/mock-get-quote.js'

const mswServer = setupMswServer()

const reference = 'NRF-123456'
const requestUrl = `${routePath}?reference=${reference}`

describe('Confirmation page', () => {
  const getServer = setupTestServer()

  it('should render the page heading and title', async () => {
    mockGetQuote(mswServer, { reference })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    expect(document.title).toBe(
      'Your details have been submitted - Nature restoration levy - Gov.uk'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your details have been submitted'
    )
  })

  it('should show the reference number', async () => {
    mockGetQuote(mswServer, { reference })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    expect(getByRole(document, 'main')).toHaveTextContent(
      'NRF reference: NRF-123456'
    )
  })
})
