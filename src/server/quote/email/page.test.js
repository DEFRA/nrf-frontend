import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Email page', () => {
  const getServer = setupTestServer()
  const changeUrl = `${routePath}?change=true`
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render all page elements', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Enter your email address'
    )
    expect(document.title).toBe(
      'Email address - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/boundary-type'
    )
    expect(getByLabelText(document, 'Enter your email address')).toHaveValue('')
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it('should link back to check-your-answers when loaded with change=true', async () => {
    const document = await loadPage({
      requestUrl: changeUrl,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it('should redirect back to check-your-answers when a change is submitted', async () => {
    const { response } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: { email: 'test@example.com' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('should keep change mode when a change submission fails validation', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(changeUrl)
    const document = await loadPage({
      requestUrl: changeUrl,
      server: getServer(),
      cookie
    })
    expectInputError({
      document,
      inputLabel: 'Enter your email address',
      errorMessage: 'Enter your email address'
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it("should remember the user's previously entered email", async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: 'test@example.com' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    expect(getByLabelText(document, 'Enter your email address')).toHaveValue(
      'test@example.com'
    )
  })

  it('should show a validation error when no email is submitted', async () => {
    const { response, cookie: updatedCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    expectInputError({
      document,
      inputLabel: 'Enter your email address',
      errorMessage: 'Enter your email address'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { email: 'test@example.com' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/check-your-answers')
  })
})
