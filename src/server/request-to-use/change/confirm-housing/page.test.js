import { getByLabelText, getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import { expectFieldsetError } from '../../../../test-utils/assertions.js'

describe('Change confirm housing page', () => {
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

  it('should show the housing question with a back link to the review page', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Are you developing housing units?'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      reviewQuoteDetailsPath
    )
    expect(
      document.querySelector('input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('should return to the review page with the unchanged answer when housing is confirmed on a change', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: { isHousing: 'yes' },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(reviewQuoteDetailsPath)

    const document = await loadPage({
      requestUrl: reviewQuoteDetailsPath,
      server: getSeededServer(),
      cookie
    })

    const housingValue = [
      ...document.querySelectorAll('.govuk-summary-list__value')
    ][1]
    expect(housingValue).toHaveTextContent('Yes')
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
      errorMessage: 'Select yes if you are developing housing'
    })
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      reviewQuoteDetailsPath
    )
  })

  it('should redirect to the not housing page when a change selects No', async () => {
    const { response, cookie } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: { isHousing: 'no' },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/request-to-use/change/not-housing')

    const document = await loadPage({
      requestUrl: '/request-to-use/change/not-housing',
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature restoration levy is only available for housing units'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      routePath
    )
  })

  it('should keep the saved answer and the review back link when backing out of the dropout page', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: { isHousing: 'no' },
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    // The ineligible answer was never saved: the original answer is still
    // selected and the back link still returns to the review page.
    expect(getByLabelText(document, 'Yes')).toBeChecked()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      reviewQuoteDetailsPath
    )
  })
})
