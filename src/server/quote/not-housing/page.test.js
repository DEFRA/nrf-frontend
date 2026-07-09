import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Not housing page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature restoration levy is only available for housing units'
    )
    expect(document.title).toBe(
      'Nature restoration levy is only available for housing units - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/confirm-housing'
    )
  })
})
