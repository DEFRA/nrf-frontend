import { getByRole, queryByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { withEmailAcceptedSession } from '../../../test-utils/with-email-accepted-session.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'

const mswServer = setupMswServer()

describe('We have sent you an email page', () => {
  const getServer = setupTestServer()
  let cookie

  beforeEach(async () => {
    cookie = await withEmailAcceptedSession(getServer(), mswServer)
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

  it('should not render a back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    expect(
      queryByRole(document, 'link', { name: 'Back' })
    ).not.toBeInTheDocument()
  })

  it('should show the email sent confirmation content', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    const main = getByRole(document, 'main')

    expect(main).toHaveTextContent('We’ve sent an email to')
    expect(main).toHaveTextContent(
      'The email contains a link you can use to retrieve your quote details.'
    )
    expect(main).toHaveTextContent(
      'If you do not receive the email, check your spam or junk folder.'
    )
  })

  it('should show the email address the link was sent to', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    expect(getByRole(document, 'main')).toHaveTextContent(
      `We’ve sent an email to ${fullQuote.email.address}.`
    )
  })

  it('should show contact details for help with the nature restoration levy', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    assertContactDetails(document)
  })

  it('should redirect to the start page without an accepted email', async () => {
    const response = await getServer().inject({ method: 'GET', url: routePath })

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })
})
