import { http, HttpResponse } from 'msw'
import { getByRole, queryByRole } from '@testing-library/dom'
import { config } from '../../../config/config.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as emailConfirmationPath } from '../email-confirmation/route-path.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { mockResendLink } from '../../../test-utils/mock-get-quote.js'
import {
  expiredLinkReference,
  expiredLinkToken,
  loadExpiredLinkPage,
  submitRequestNewLink
} from '../../../test-utils/with-expired-link-session.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const mswServer = setupMswServer()

describe('This link has expired page', () => {
  const getServer = setupTestServer()

  const loadExpiredPage = () =>
    loadExpiredLinkPage({ server: getServer(), mswServer })

  const requestNewLink = () =>
    submitRequestNewLink({ server: getServer(), mswServer })

  it('should render a page heading and title', async () => {
    const { document } = await loadExpiredPage()
    const { pageTitle, pageHeading } = getViewModel()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(document.title).toBe(pageTitle)
  })

  it('should not render a back link', async () => {
    const { document } = await loadExpiredPage()

    expect(
      queryByRole(document, 'link', { name: 'Back' })
    ).not.toBeInTheDocument()
  })

  it('should explain that the link has expired', async () => {
    const { document } = await loadExpiredPage()

    expect(getByRole(document, 'main')).toHaveTextContent(
      'The link to retrieve your quote details has expired. The link in the email can only be used once and only for a limited time.'
    )
  })

  it('should offer a way to request a new link without using a GET link', async () => {
    const { document } = await loadExpiredPage()

    const button = getByRole(document, 'button', { name: 'request a new link' })
    expect(button.closest('form')).toHaveAttribute('method', 'post')
    expect(
      queryByRole(document, 'link', { name: 'request a new link' })
    ).not.toBeInTheDocument()
  })

  it('should include the hidden CSRF token input', async () => {
    const { document } = await loadExpiredPage()

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it.each([
    [
      'loading the page',
      () => getResponse({ server: getServer(), requestUrl: routePath })
    ],
    [
      'requesting a new link',
      () =>
        submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: {}
        }).then(({ response }) => response)
    ]
  ])(
    'should show the page not found page when %s without opening an expired link first',
    async (_name, makeRequest) => {
      const resendRequests = mockResendLink(mswServer)

      const response = await makeRequest()

      expect(response.statusCode).toBe(statusCodes.notFound)
      expect(resendRequests).toEqual([])
    }
  )

  describe('requesting a new link', () => {
    it('should send the expired link token to the backend and show the email confirmation page', async () => {
      const resendRequests = mockResendLink(mswServer)

      const { response } = await requestNewLink()

      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(emailConfirmationPath)
      expect(resendRequests).toEqual([{ token: expiredLinkToken }])
    })

    it('should show the address the new link was sent to', async () => {
      mockResendLink(mswServer)
      const { cookie } = await requestNewLink()

      const document = await loadPage({
        requestUrl: emailConfirmationPath,
        server: getServer(),
        cookie
      })

      expect(getByRole(document, 'main')).toHaveTextContent(
        `We’ve sent an email to ${fullQuote.email.address}.`
      )
    })

    it('should not allow the same expired link to be used to request another', async () => {
      mockResendLink(mswServer)
      const { cookie } = await requestNewLink()

      const response = await getResponse({
        server: getServer(),
        requestUrl: routePath,
        cookie
      })

      expect(response.statusCode).toBe(statusCodes.notFound)
    })

    it('should show the page not found page when the backend does not accept the token', async () => {
      mockResendLink(mswServer, { matched: false })

      const { response } = await requestNewLink()

      expect(response.statusCode).toBe(statusCodes.notFound)
    })

    it('should show the error page when the backend fails', async () => {
      mswServer.use(
        http.post(
          `${config.get('backend').apiUrl}/quotes/${expiredLinkReference}/resend-link`,
          () =>
            HttpResponse.json(
              { ok: false },
              { status: statusCodes.internalServerError }
            )
        )
      )

      const { response } = await requestNewLink()

      expect(response.statusCode).toBe(statusCodes.internalServerError)
    })
  })
})
