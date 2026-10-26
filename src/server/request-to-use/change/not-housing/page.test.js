import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { mergeCookies } from '../../../../test-utils/merge-cookies.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import {
  mockReadQuote,
  mockRedeemToken
} from '../../../../test-utils/mock-get-quote.js'
import { savedQuote } from '../../../../test-utils/fixtures/saved-quote.js'

const mswServer = setupMswServer()

const magicLink = `/request-to-use/retrieve/${savedQuote.reference}/abc123_TOKEN-xyz`

describe('Change not housing page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()
  const changeConfirmHousingPath = '/request-to-use/change/confirm-housing'

  it('should redirect to the start page when there is no request to use session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })

  it('should render the dropout page with a back link to the change page', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature restoration levy is only available for housing units'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      changeConfirmHousingPath
    )
  })

  it('should render for a real magic link session after a change selects No', async () => {
    mockRedeemToken(mswServer)
    mockReadQuote(mswServer, savedQuote)

    const { headers } = await getResponse({
      server: getServer(),
      requestUrl: magicLink
    })
    const cookie = mergeCookies(null, headers['set-cookie'])

    const { response, cookie: postCookie } = await submitForm({
      requestUrl: changeConfirmHousingPath,
      server: getServer(),
      formData: { isHousing: 'no' },
      cookie
    })
    expect(response.headers.location).toBe(routePath)

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: postCookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature restoration levy is only available for housing units'
    )
  })
})
