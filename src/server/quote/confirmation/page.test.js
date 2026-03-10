import { getByRole } from '@testing-library/dom'
import { http, HttpResponse } from 'msw'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'

const mswServer = setupMswServer()

describe('Confirmation page', () => {
  const getServer = setupTestServer()

  it('should render the page heading and title', async () => {
    mswServer.use(
      http.get('http://localhost:3001/quote/NRF-123456', () =>
        HttpResponse.json({ reference: 'NRF-123456' })
      )
    )
    const document = await loadPage({
      requestUrl: `${routePath}?reference=NRF-123456`,
      server: getServer()
    })
    expect(document.title).toBe(
      'Your details have been submitted - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your details have been submitted'
    )
  })

  it('should show the reference number', async () => {
    mswServer.use(
      http.get('http://localhost:3001/quote/NRF-123456', () =>
        HttpResponse.json({ reference: 'NRF-123456' })
      )
    )
    const document = await loadPage({
      requestUrl: `${routePath}?reference=NRF-123456`,
      server: getServer()
    })
    expect(getByRole(document, 'main')).toHaveTextContent(
      'NRF reference: NRF-123456'
    )
  })
})
