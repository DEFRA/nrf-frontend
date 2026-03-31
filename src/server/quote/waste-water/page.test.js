import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Waste water treatment works page', () => {
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
      'Confirm which waste water treatment works will be used for this development'
    )
    expect(document.title).toBe(
      'Confirm which waste water treatment works will be used for this development - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/residential'
    )
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it("should remember the user's previous selection", async () => {
    const { cookie: updatedCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { wasteWaterTreatmentWorks: 'i-dont-know' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: updatedCookie
    })
    expect(
      getByLabelText(
        document,
        "I don't know the waste water treatment works yet"
      )
    ).toBeChecked()
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
      errorMessage:
        'Select a waste water treatment works, or select that you do not know yet'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { wasteWaterTreatmentWorks: 'i-dont-know' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/quote/email')
  })
})
