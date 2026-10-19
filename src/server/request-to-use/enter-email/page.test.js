import { getByRole, getByLabelText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'
import { routePath as emailConfirmationPath } from '../email-confirmation/route-path.js'
import { routePath as quoteNotMatchedPath } from '../quote-not-matched/route-path.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import {
  mockEmailQuoteLink,
  mockEmailQuoteLinkError
} from '../../../test-utils/mock-get-quote.js'

const inputLabel = 'Enter your email address'
const missingMessage = 'Enter your email address'
const formatMessage =
  'Enter an email address in the correct format, like name@example.com'
const validEmail = fullQuote.email.address
const otherEmail = 'other@example.com'

const mswServer = setupMswServer()

describe('Enter your email address page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(async () => {
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
    sessionCookie = referenceCookie
    mockEmailQuoteLink(mswServer)
  })

  const loadForm = () =>
    loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })

  it('should render all page elements', async () => {
    const document = await loadForm()
    const { pageTitle, pageHeading } = getViewModel()
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    const input = getByLabelText(document, inputLabel)
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAccessibleDescription(
      'Enter the email address you used to get your quote. We’ll send you a link to retrieve your quote details.'
    )
    expect(getByRole(document, 'button', { name: 'Continue' })).toBeVisible()
  })

  it('should link back to the enter your NRL reference page', async () => {
    const document = await loadForm()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      enterNrlReferencePath
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadForm()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it.each([
    { scenario: 'a valid email address', value: validEmail },
    { scenario: 'an email address with whitespace', value: `  ${validEmail} ` }
  ])(
    'should redirect to the email confirmation page when a quote matches $scenario',
    async ({ value }) => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { email: value },
        cookie: sessionCookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(emailConfirmationPath)
    }
  )

  it('should show the email address on the email confirmation page when a quote matches', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: `  ${validEmail} ` },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: emailConfirmationPath,
      server: getServer(),
      cookie
    })
    expect(getByRole(document, 'main')).toHaveTextContent(
      `We’ve sent an email to ${validEmail}.`
    )
  })

  it('should clear the retrieve quote answers when a quote matches', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: validEmail },
      cookie: sessionCookie
    })
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie
    })
    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })

  it.each([
    {
      scenario: 'a different email',
      arrange: () => undefined,
      email: otherEmail
    },
    {
      scenario: 'a reference with no quote',
      arrange: () =>
        mockEmailQuoteLink(mswServer, {
          ...fullQuote,
          reference: 'NRL-999999'
        }),
      email: validEmail
    }
  ])(
    'should redirect to the quote not matched page for $scenario and keep the answers',
    async ({ arrange, email }) => {
      arrange()
      const { response, cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { email },
        cookie: sessionCookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(quoteNotMatchedPath)

      const enterNrlReferenceDocument = await loadPage({
        requestUrl: enterNrlReferencePath,
        server: getServer(),
        cookie
      })
      expect(
        getByLabelText(enterNrlReferenceDocument, 'Enter your NRL reference')
      ).toHaveValue(fullQuote.reference)
    }
  )

  it('should show the submitted email when returning from the quote not matched page', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: otherEmail },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue(otherEmail)
  })

  it('should redirect to the start page when there is no saved NRL reference', async () => {
    const cookie = await withValidRetrieveQuoteSession(getServer())
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: validEmail },
      cookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(startPath)
  })

  it('should show the error page when the backend fails, not the quote not matched page', async () => {
    mockEmailQuoteLinkError(mswServer, statusCodes.internalServerError)
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: validEmail },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.internalServerError)
    expect(response.headers.location).toBeUndefined()
    const { window } = new JSDOM(response.result)
    expect(
      getByRole(window.document, 'heading', { level: 1 })
    ).toHaveTextContent('Sorry, there is a problem with the service')
  })

  it.each([
    { scenario: 'is absent', formData: {}, errorMessage: missingMessage },
    {
      scenario: 'is empty',
      formData: { email: '' },
      errorMessage: missingMessage
    },
    {
      scenario: 'is only whitespace',
      formData: { email: '   ' },
      errorMessage: missingMessage
    },
    {
      scenario: 'has no @ symbol',
      formData: { email: 'testemail.com' },
      errorMessage: formatMessage
    },
    {
      scenario: 'has no domain',
      formData: { email: 'test@' },
      errorMessage: formatMessage
    }
  ])(
    'should redirect back with a validation error when the email address $scenario',
    async ({ formData, errorMessage }) => {
      const { response, cookie } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData,
        cookie: sessionCookie
      })
      expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(response.headers.location).toBe(routePath)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })
      expectInputError({ document, inputLabel, errorMessage })
      expect(document.title).toBe(`Error: ${getViewModel().pageTitle}`)
    }
  )

  it('should show the invalid value as typed after a format error', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: 'testemail.com' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByLabelText(document, inputLabel)).toHaveValue('testemail.com')
  })

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath
    })
    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })
})
