import { http, HttpResponse } from 'msw'
import { config } from '../../../config/config.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { getResponse } from '../../../test-utils/get-response.js'
import {
  mockReadQuote,
  mockRedeemToken
} from '../../../test-utils/mock-get-quote.js'
import { savedQuote } from '../../../test-utils/fixtures/saved-quote.js'
import { routePath as reviewQuoteDetailsPath } from '../review-quote-details/route-path.js'
import { routePath as linkExpiredPath } from '../link-expired/route-path.js'

const reference = savedQuote.reference
const token = 'abc123_TOKEN-xyz'
const magicLink = `/request-to-use/retrieve/${reference}/${token}`
const botUserAgent =
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'

const mswServer = setupMswServer()

describe('Retrieve quote magic link', () => {
  const getServer = setupTestServer()

  const openLink = ({ requestUrl = magicLink, headers } = {}) =>
    getServer().inject({ method: 'GET', url: requestUrl, headers })

  it('should redirect to the review and amend page for a valid link', async () => {
    const redeemRequests = mockRedeemToken(mswServer)
    mockReadQuote(mswServer, savedQuote)

    const response = await openLink()

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(reviewQuoteDetailsPath)
    expect(redeemRequests).toEqual([{ token }])
  })

  it('should not put the token in the redirect URL', async () => {
    mockRedeemToken(mswServer)
    mockReadQuote(mswServer, savedQuote)

    const response = await openLink()

    expect(response.headers.location).not.toContain(token)
  })

  it.each(['invalid', 'expired', 'not_found'])(
    'should redirect to the link expired page when the link is %s',
    async (accessStatus) => {
      mockRedeemToken(mswServer, { accessStatus })

      const response = await openLink()

      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(linkExpiredPath)
    }
  )

  it('should not read the quote when the link is not valid', async () => {
    mockRedeemToken(mswServer, { accessStatus: 'expired' })
    let quoteRead = false
    mswServer.use(
      http.get(`${config.get('backend').apiUrl}/quotes/${reference}`, () => {
        quoteRead = true
        return HttpResponse.json(savedQuote)
      })
    )

    await openLink()

    expect(quoteRead).toBe(false)
  })

  it('should not spend the link for a link previewer', async () => {
    const redeemRequests = mockRedeemToken(mswServer)

    const response = await openLink({
      headers: { 'user-agent': botUserAgent }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.headers.location).toBeUndefined()
    expect(redeemRequests).toEqual([])
  })

  it.each([
    ['the reference', `/request-to-use/retrieve/NRL-12/${token}`],
    ['the token', `/request-to-use/retrieve/${reference}/bad%20token`]
  ])(
    'should redirect to the link expired page without calling the backend when %s is malformed',
    async (_name, requestUrl) => {
      const redeemRequests = mockRedeemToken(mswServer)

      const response = await openLink({ requestUrl })

      expect(response.headers.location).toBe(linkExpiredPath)
      expect(redeemRequests).toEqual([])
    }
  )

  it('should show the error page when the backend fails', async () => {
    mswServer.use(
      http.post(
        `${config.get('backend').apiUrl}/quotes/${reference}/redeem-token`,
        () =>
          HttpResponse.json(
            { ok: false },
            { status: statusCodes.internalServerError }
          )
      )
    )

    const response = await getResponse({
      server: getServer(),
      requestUrl: magicLink
    })

    expect(response.statusCode).toBe(statusCodes.internalServerError)
  })
})
