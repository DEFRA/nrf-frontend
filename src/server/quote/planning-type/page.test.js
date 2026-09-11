import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import getViewModel from './get-view-model.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/route-path.js'
import { routePath as applicationTypeNotAvailablePath } from '../application-type-not-available/route-path.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'

describe('Planning type page', () => {
  const getServer = setupTestServer()
  const changeUrl = `${routePath}?change=true`
  const dropoutChangeUrl = `${applicationTypeNotAvailablePath}?change=true`
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

  it('should redirect straight to application-type-not-available (with change=true) when a change selects Other', async () => {
    const { response } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: { planningType: 'other' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(dropoutChangeUrl)
  })

  it('should return to check-your-answers when a change selects a valid type after backing out of the dropout page', async () => {
    const { response } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: { planningType: 'other' },
      cookie: sessionCookie
    })
    expect(response.headers.location).toBe(dropoutChangeUrl)

    // Follow the dropout page's back link (it carries change=true), then
    // submit a valid planning type — the journey must return to CYA, not
    // restart from confirm-housing.
    const document = await loadPage({
      requestUrl: dropoutChangeUrl,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      changeUrl
    )

    const { response: retryResponse } = await submitForm({
      requestUrl: changeUrl,
      server: getServer(),
      formData: { planningType: 'full-planning-permission' },
      cookie: sessionCookie
    })
    expect(retryResponse.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(retryResponse.headers.location).toBe(checkYourAnswersPath)
  })

  it('should show a validation error after an invalid form submission', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
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
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBeDefined()
  })

  it('should redirect to application-type-not-available when Other is selected', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { planningType: 'other' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(applicationTypeNotAvailablePath)
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
