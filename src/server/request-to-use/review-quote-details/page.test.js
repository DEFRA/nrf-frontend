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
import { mergeCookies } from '../../../test-utils/merge-cookies.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import {
  mockReadQuote,
  mockRedeemToken
} from '../../../test-utils/mock-get-quote.js'
import { savedQuote } from '../../../test-utils/fixtures/saved-quote.js'

const mswServer = setupMswServer()

const magicLink = `/request-to-use/retrieve/${savedQuote.reference}/abc123_TOKEN-xyz`

describe('Review and amend the quote details page', () => {
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

  it('should redirect to the start page when the quote session is initialised but empty', async () => {
    const cookie = await withValidQuoteSession(getSeededServer())

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
      'Review and amend the quote details for NRL-123456 - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Review and amend the quote details for NRL-123456'
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

    expect(
      document.querySelector('.govuk-warning-text__text')
    ).toHaveTextContent(
      'Updates may result in a recalculation of available capacity and the levy amount.'
    )
  })

  it('should link the question answer changes to their change pages and keep the boundary change link as a placeholder', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(
      getByRole(document, 'link', { name: 'Changeplanning permission type' })
    ).toHaveAttribute('href', '/request-to-use/change/planning-type')

    expect(
      getByRole(document, 'link', { name: 'Changered line boundary' })
    ).toHaveAttribute('href', '#')

    expect(
      getByRole(document, 'link', {
        name: 'Changewhether you are developing housing'
      })
    ).toHaveAttribute('href', '/request-to-use/change/confirm-housing')

    expect(
      getByRole(document, 'link', { name: 'Changenumber of housing units' })
    ).toHaveAttribute('href', '/request-to-use/change/unit-number')
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

  it('should render a boundary filename containing HTML as escaped text', async () => {
    // The real magic link flow (NRF2-1256) writes the session this page reads,
    // so it is used here to seed a hostile uploaded filename.
    const hostileFilename = 'x<script>alert(1)</script>.geojson'
    mockRedeemToken(mswServer)
    mockReadQuote(mswServer, {
      ...savedQuote,
      boundary: { ...savedQuote.boundary, filename: hostileFilename }
    })

    const { headers } = await getResponse({
      server: getServer(),
      requestUrl: magicLink
    })
    const cookie = mergeCookies(null, headers['set-cookie'])

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    const boundaryValue = [
      ...document.querySelectorAll('.govuk-summary-list__value')
    ].find((value) => value.textContent.includes(hostileFilename))
    expect(boundaryValue).toBeDefined()
    expect(boundaryValue).toHaveTextContent(hostileFilename)
    expect(boundaryValue.querySelector('script')).toBeNull()
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
