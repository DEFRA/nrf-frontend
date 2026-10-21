import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as enterEmailPath } from '../enter-email/route-path.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withQuoteNotMatchedSession } from '../../../test-utils/with-quote-not-matched-session.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'

const mswServer = setupMswServer()

describe('These details do not match our records page', () => {
  const getServer = setupTestServer()

  const loadNotMatchedPage = async () => {
    const cookie = await withQuoteNotMatchedSession(getServer(), mswServer)
    return loadPage({ requestUrl: routePath, server: getServer(), cookie })
  }

  it('should render a page heading and title', async () => {
    const document = await loadNotMatchedPage()
    const { pageTitle, pageHeading } = getViewModel()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(document.title).toBe(pageTitle)
  })

  it('should link back to the enter your email address page', async () => {
    const document = await loadNotMatchedPage()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      enterEmailPath
    )
  })

  it.each([enterEmailPath, enterNrlReferencePath, haveNrlReferencePath])(
    'should load %s, not redirect, when going back from the page',
    async (requestUrl) => {
      const cookie = await withQuoteNotMatchedSession(getServer(), mswServer)

      const response = await getResponse({
        server: getServer(),
        requestUrl,
        cookie
      })

      expect(response.statusCode).toBe(statusCodes.ok)
    }
  )

  it('should link the get a quote link to the root redirect', async () => {
    const document = await loadNotMatchedPage()

    expect(
      getByRole(document, 'link', { name: 'get a quote at any time' })
    ).toHaveAttribute('href', '/')
  })

  it('should redirect to the start page when no quote failed to match', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath
    })

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })
})
