import { getByRole, queryByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from '../enter-email/route-path.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { mockReadQuote } from '../../../test-utils/mock-get-quote.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'

const mswServer = setupMswServer()

describe('We have sent you an email page', () => {
  const getServer = setupTestServer()

  it('should render a page heading and title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
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
      server: getServer()
    })

    expect(
      queryByRole(document, 'link', { name: 'Back' })
    ).not.toBeInTheDocument()
  })

  it('should show the email sent confirmation content', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
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
    mockReadQuote(mswServer)
    const cookie = await withValidRetrieveQuoteSession(getServer())
    const { cookie: haveReferenceCookie } = await submitForm({
      requestUrl: haveNrlReferencePath,
      server: getServer(),
      formData: { hasNrlReference: 'yes' },
      cookie
    })
    const { cookie: referenceCookie } = await submitForm({
      requestUrl: enterNrlReferencePath,
      server: getServer(),
      formData: { nrlReference: fullQuote.reference },
      cookie: haveReferenceCookie
    })
    const { cookie: submittedCookie } = await submitForm({
      requestUrl: enterEmailPath,
      server: getServer(),
      formData: { email: fullQuote.email.address },
      cookie: referenceCookie
    })

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: submittedCookie
    })

    expect(getByRole(document, 'main')).toHaveTextContent(
      `We’ve sent an email to ${fullQuote.email.address}.`
    )
  })

  it('should show contact details for help with the nature restoration levy', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    assertContactDetails(document)
  })
})
