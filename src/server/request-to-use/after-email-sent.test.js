import { statusCodes } from '../common/constants/status-codes.js'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { getResponse } from '../../test-utils/get-response.js'
import { mockResendLink } from '../../test-utils/mock-get-quote.js'
import { withEmailAcceptedSession } from '../../test-utils/with-email-accepted-session.js'
import { submitRequestNewLink } from '../../test-utils/with-expired-link-session.js'
import { fullQuote } from '../../test-utils/fixtures/quote.js'
import { routePath as startPath } from '../manage/start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../manage/what-would-you-like-to-do/route-path.js'
import { routePath as haveNrlReferencePath } from './have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from './enter-nrl-reference/route-path.js'
import { routePath as enterEmailPath } from './enter-email/route-path.js'
import { routePath as noNrlReferencePath } from './no-nrl-reference/route-path.js'
import { routePath as quoteNotMatchedPath } from './quote-not-matched/route-path.js'
import { routePath as emailConfirmationPath } from './email-confirmation/route-path.js'

const mswServer = setupMswServer()

const emailSentSessions = [
  {
    entryPoint: 'submitting the email address',
    createSession: async (server) => withEmailAcceptedSession(server, mswServer)
  },
  {
    entryPoint: 'requesting a new link from the link expired page',
    createSession: async (server) => {
      mockResendLink(mswServer)
      const { cookie } = await submitRequestNewLink({
        server,
        mswServer
      })
      return cookie
    }
  }
]

const unreachablePaths = [
  whatWouldYouLikeToDoPath,
  haveNrlReferencePath,
  enterNrlReferencePath,
  enterEmailPath,
  noNrlReferencePath,
  quoteNotMatchedPath
]

const reachablePaths = [
  startPath,
  emailConfirmationPath,
  `${enterNrlReferencePath}?nrlReference=${fullQuote.reference}`
]

// Pages with their own session checks, outside the retrieve quote journey's
// email sent state.
const pathsWithOwnSessionChecks = [
  '/request-to-use/retrieve/{reference}/{token}',
  '/request-to-use/review-quote-details',
  '/request-to-use/link-expired'
]

describe('After the retrieve quote email is sent', () => {
  const getServer = setupTestServer()

  describe.each(emailSentSessions)('when $entryPoint', ({ createSession }) => {
    it.each(unreachablePaths)(
      'should redirect %s to the start page',
      async (requestUrl) => {
        const cookie = await createSession(getServer())

        const response = await getResponse({
          server: getServer(),
          requestUrl,
          cookie
        })

        expect(response.statusCode).toBe(statusCodes.found)
        expect(response.headers.location).toBe(startPath)
      }
    )

    it.each(reachablePaths)('should still show %s', async (requestUrl) => {
      const cookie = await createSession(getServer())

      const response = await getResponse({
        server: getServer(),
        requestUrl,
        cookie
      })

      expect(response.statusCode).toBe(statusCodes.ok)
    })
  })

  it('should have decided for every request to use page whether it stays reachable', () => {
    const knownPaths = new Set(
      [
        ...unreachablePaths,
        ...reachablePaths,
        ...pathsWithOwnSessionChecks
      ].map((path) => path.split('?')[0])
    )

    const requestToUsePaths = getServer()
      .table()
      .filter(
        ({ method, path }) =>
          method === 'get' && path.startsWith('/request-to-use')
      )
      .map(({ path }) => path)

    expect(requestToUsePaths.filter((path) => !knownPaths.has(path))).toEqual(
      []
    )
  })
})
