import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

describe('No EDP page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render a page heading and a title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature restoration levy is not available in this area'
    )
    expect(document.title).toBe('Not in EDP - Nature restoration levy - GOV.UK')
  })

  // A dropout reached while editing a saved quote from the review page links
  // back into the change alias, whose pages this session can actually open.
  it('should link back into the change alias when editing a saved quote', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/change/draw-boundary'
    )
  })
})
