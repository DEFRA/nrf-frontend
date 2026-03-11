import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Development type page', () => {
  const getServer = setupTestServer()
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
      'What type of development is it?'
    )
    expect(document.title).toBe(
      'What type of development is it? - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '#'
    )
    // unchecked, if user made no previous input
    expect(getByLabelText(document, 'Housing')).not.toBeChecked()
    expect(getByLabelText(document, 'Other residential')).not.toBeChecked()
    // CSRF token
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it("should remember the user's previous selection", async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { developmentTypes: ['housing'] },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    expect(getByLabelText(document, 'Housing')).toBeChecked()
    expect(getByLabelText(document, 'Other residential')).not.toBeChecked()
  })

  it('should show a validation error, after an invalid form submission', async () => {
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
    expectFieldsetError({
      document,
      errorMessage: 'Select a development type to continue'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { developmentTypes: ['other-residential'] },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/people-count')
  })
})
