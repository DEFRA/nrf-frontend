import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Application type not available page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render the page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    const { pageTitle, pageHeading, backLinkPath } = getViewModel()
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      backLinkPath
    )
  })
})
