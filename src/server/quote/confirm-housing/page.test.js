import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'

describe('Confirm housing page', () => {
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
      'Are you developing housing units?'
    )
    expect(document.title).toBe(
      'Confirm housing - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/planning-type'
    )
    expect(getByRole(document, 'radio', { name: 'Yes' })).not.toBeChecked()
    expect(getByRole(document, 'radio', { name: 'No' })).not.toBeChecked()
    const csrfToken = document.querySelector('form input[name="csrfToken"]')
    expect(csrfToken).toBeInTheDocument()
  })

  it("should remember the user's previous selection", async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { isHousing: 'yes' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByRole(document, 'radio', { name: 'Yes' })).toBeChecked()
    expect(getByRole(document, 'radio', { name: 'No' })).not.toBeChecked()
  })

  it('should show a validation error, after an invalid form submission', async () => {
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
      errorMessage: 'Select yes if you are developing housing'
    })
  })

  it('should redirect to the next page', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { isHousing: 'yes' },
      cookie: sessionCookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/quote/unit-number')
  })

  it('should redirect to not-housing (with change=true) when a change-mode submission selects No', async () => {
    const cookie = await withCompleteQuoteSession(getServer())

    const { response } = await submitForm({
      requestUrl: '/quote/confirm-housing?change=true',
      server: getServer(),
      formData: { isHousing: 'no' },
      cookie
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/quote/not-housing?change=true')

    const document = await loadPage({
      requestUrl: '/quote/confirm-housing?change=true',
      server: getServer(),
      cookie
    })
    expect(getByRole(document, 'radio', { name: 'Yes' })).toBeChecked()
    expect(getByRole(document, 'radio', { name: 'No' })).not.toBeChecked()

    const checkYourAnswers = await loadPage({
      requestUrl: '/quote/check-your-answers',
      server: getServer(),
      cookie
    })
    expect(
      getByRole(checkYourAnswers, 'heading', { level: 1 })
    ).toHaveTextContent('Check your answers')
    const rows = Array.from(
      checkYourAnswers.querySelectorAll('.govuk-summary-list__row')
    )
    const housingRow = rows.find((row) =>
      row
        .querySelector('.govuk-summary-list__key')
        .textContent.includes('Housing')
    )
    expect(
      housingRow.querySelector('.govuk-summary-list__value')
    ).toHaveTextContent('Yes')
  })

  it('should remember a first-run No selection', async () => {
    const { cookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: { isHousing: 'no' },
      cookie: sessionCookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })
    expect(getByRole(document, 'radio', { name: 'No' })).toBeChecked()
  })
})
