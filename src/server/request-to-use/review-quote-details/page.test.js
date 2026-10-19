import { getByRole, queryByRole } from '@testing-library/dom'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath } from './routes.js'
import { routePath as startPath } from '../../manage/start-page/route-path.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { failIfBackendCalled } from '../../../test-utils/fail-if-backend-called.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'

const mswServer = setupMswServer()

describe('Review and amend your quote details page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()

  it('should redirect to the start page when there is no session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath
    })

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })

  it('should redirect to the start page when there is no request to use session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })

  it('should redirect to the start page when there is no quote session', async () => {
    const cookie = await withValidRetrieveQuoteSession(getSeededServer())

    const response = await getResponse({
      server: getSeededServer(),
      requestUrl: routePath,
      cookie
    })

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(startPath)
  })

  it('should show the saved quote details from the session without fetching the quote from the backend', async () => {
    failIfBackendCalled(mswServer, ['/quotes'])
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(document.title).toBe(
      'Review and amend your quote details - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Review and amend your quote details'
    )

    const keys = [...document.querySelectorAll('.govuk-summary-list__key')].map(
      (key) => key.textContent.trim()
    )
    expect(keys).toEqual([
      'Planning permission type',
      'Housing',
      'Number of housing units',
      'Red line boundary',
      'Email address'
    ])

    const values = [
      ...document.querySelectorAll('.govuk-summary-list__value')
    ].map((value) => value.textContent.trim())
    expect(values).toEqual([
      'Full planning permission',
      'Yes',
      '42',
      'Added',
      'test@example.com'
    ])

    // The message sits in a p inside the strong: global styles render it in a
    // normal font weight, matching the prototype.
    expect(
      document.querySelector('.govuk-warning-text__text p')
    ).toHaveTextContent(
      'Updates may result in a recalculation of available capacity and the levy amount.'
    )
  })

  it('should render the change links and Continue button as placeholders', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    for (const name of [
      'Changeplanning permission type',
      'Changewhether you are developing housing',
      'Changenumber of housing units',
      'Changedrawn red line boundary'
    ]) {
      expect(getByRole(document, 'link', { name })).toHaveAttribute('href', '#')
    }
    expect(
      queryByRole(document, 'link', { name: 'Changeemail address' })
    ).not.toBeInTheDocument()
    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
    expect(
      document.querySelector('input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it('should not render a back link or a delete link', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(
      queryByRole(document, 'link', { name: 'Back' })
    ).not.toBeInTheDocument()
    expect(
      queryByRole(document, 'link', { name: /Delete/ })
    ).not.toBeInTheDocument()
  })
})
