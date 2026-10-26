import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'

describe('You need a quote before you can request to use the nature restoration levy page', () => {
  const getServer = setupTestServer()
  let cookie

  beforeEach(async () => {
    cookie = await withValidRetrieveQuoteSession(getServer())
  })

  it('should render a page heading and title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    const { pageTitle, pageHeading } = getViewModel()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(document.title).toBe(pageTitle)
  })

  it('should link back to the do you have an NRL reference page', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      haveNrlReferencePath
    )
  })

  it('should load the do you have an NRL reference page, not redirect, when going back', async () => {
    const { cookie: answeredCookie } = await submitForm({
      requestUrl: haveNrlReferencePath,
      server: getServer(),
      formData: { hasNrlReference: 'no' },
      cookie
    })

    const response = await getResponse({
      server: getServer(),
      requestUrl: haveNrlReferencePath,
      cookie: answeredCookie
    })

    expect(response.statusCode).toBe(statusCodes.ok)
  })

  it('should link the get a quote link to the root redirect', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    expect(
      getByRole(document, 'link', { name: 'get a quote at any time' })
    ).toHaveAttribute('href', '/')
  })

  it('should redirect to the start page without a retrieve quote session', async () => {
    const response = await getServer().inject({ method: 'GET', url: routePath })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })
})
