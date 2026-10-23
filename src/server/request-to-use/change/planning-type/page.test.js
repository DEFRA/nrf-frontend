import { getByLabelText, getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import { expectFieldsetError } from '../../../../test-utils/assertions.js'

describe('Change planning type page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()
  const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

  it('should redirect to the start page when there is no request to use session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })

  it('should show the planning application type question with the saved answer and a back link to the review page', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What type of planning application are you planning to submit?'
    )
    expect(getByLabelText(document, 'Full planning permission')).toBeChecked()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      reviewQuoteDetailsPath
    )
    expect(
      document.querySelector('input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('should return to the review page showing the changed planning type when a change is submitted', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: { planningType: 'outline-planning-permission' },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(reviewQuoteDetailsPath)

    const document = await loadPage({
      requestUrl: reviewQuoteDetailsPath,
      server: getSeededServer(),
      cookie
    })

    const planningTypeValue = [
      ...document.querySelectorAll('.govuk-summary-list__value')
    ][0]
    expect(planningTypeValue).toHaveTextContent('Outline planning permission')
  })

  it('should show a validation error and keep the review back link when a change is submitted with no answer', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(routePath)

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expectFieldsetError({
      document,
      errorMessage: 'Select a planning application type'
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      reviewQuoteDetailsPath
    )
  })

  it('should redirect to the application type not available page when a change selects Other', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: { planningType: 'other' },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(
      '/quote/application-type-not-available'
    )
  })
})
