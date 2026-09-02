import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

describe('Planning type page', () => {
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
    const { pageTitle, pageHeading, backLinkPath } = getViewModel()
    expect(document.title).toBe(pageTitle)
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      backLinkPath
    )
    expect(
      getByLabelText(document, 'Full planning permission')
    ).not.toBeChecked()
    expect(
      getByLabelText(document, 'Outline planning permission')
    ).not.toBeChecked()
    expect(
      getByLabelText(document, 'Hybrid planning permission')
    ).not.toBeChecked()
    expect(getByLabelText(document, 'Other')).not.toBeChecked()
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
      formData: { planningType: 'full-planning-permission' },
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
    expectFieldsetError({
      document,
      errorMessage: 'Select a planning application type'
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it('should end up on application-type-not-available when a change selects Other', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: { planningType: 'other' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(checkYourAnswersPath)
    const summaryResponse = await getServer().inject({
      method: 'GET',
      url: checkYourAnswersPath,
      headers: { cookie }
    })
    expect(summaryResponse.statusCode).toBe(statusCodes.found)
    expect(summaryResponse.headers.location).toBe(
      '/quote/application-type-not-available'
    )
  })

  it('should show a validation error after an invalid form submission', async () => {
    const { response, cookie } = await submitForm({
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
      cookie
    })
    expectFieldsetError({
      document,
      errorMessage: 'Select a planning application type'
    })
  })

  it('should redirect to the next page on valid submission', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { planningType: 'full-planning-permission' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBeDefined()
  })

  it('should redirect to application-type-not-available when Other is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { planningType: 'other' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/quote/application-type-not-available'
    )
  })

  it("should remember the user's previous selection", async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { planningType: 'outline-planning-permission' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(
      getByLabelText(document, 'Outline planning permission')
    ).toBeChecked()
    expect(
      getByLabelText(document, 'Full planning permission')
    ).not.toBeChecked()
  })
})
