import { statusCodes } from '../common/constants/status-codes.js'
import { setupTestServer } from '../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { getResponse } from '../../test-utils/get-response.js'
import { submitForm } from '../../test-utils/submit-form.js'
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
import { routePath as reviewQuoteDetailsPath } from './review-quote-details/route-path.js'
import { routePath as acceptLevyPath } from './accept-levy/route-path.js'
import { routePath as deleteQuotePath } from './delete-quote/route-path.js'
import { routePath as defraAccountUserTypePath } from './defra-account-user-type/route-path.js'
import { routePath as changePlanningTypePath } from './change/planning-type/route-path.js'
import { routePath as changeConfirmHousingPath } from './change/confirm-housing/route-path.js'
import { routePath as changeUnitNumberPath } from './change/unit-number/route-path.js'
import { routePath as changeApplicationTypeNotAvailablePath } from './change/application-type-not-available/route-path.js'
import { routePath as changeNotHousingPath } from './change/not-housing/route-path.js'
import { routePath as changeBoundaryTypePath } from './change/boundary-type/route-path.js'
import { routePath as changeDrawBoundaryPath } from './change/draw-boundary/route-path.js'
import { routePath as changeUploadBoundaryPath } from './change/upload-boundary/route-path.js'
import { routePath as changeCheckingFilePath } from './change/checking-file/route-path.js'
import { routePath as changeFilePreviewPath } from './change/file-preview/route-path.js'
import { routePath as changeNotInEdpPath } from './change/not-in-edp/route-path.js'
import { routePath as changeExcludedAreaPath } from './change/excluded-area/route-path.js'
import { routePath as linkExpiredPath } from './link-expired/route-path.js'

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
  `${enterNrlReferencePath}?nrlReference=${fullQuote.reference}`,
  // Unguarded until the delete quote page's session behaviour ticket adds it
  // to the review quote session guard.
  deleteQuotePath,
  '/request-to-use/delete-quote-confirmation'
]

// Pages with their own session checks, outside the retrieve quote journey's
// email sent state.
const pathsWithOwnSessionChecks = [
  '/request-to-use/retrieve/{reference}/{token}',
  '/request-to-use/review-quote-details',
  acceptLevyPath,
  defraAccountUserTypePath,
  '/request-to-use/defra-account-individual',
  '/request-to-use/defra-account-organisation',
  '/request-to-use/defra-account-agent',
  changePlanningTypePath,
  changeConfirmHousingPath,
  changeUnitNumberPath,
  changeApplicationTypeNotAvailablePath,
  changeNotHousingPath,
  changeBoundaryTypePath,
  changeDrawBoundaryPath,
  changeUploadBoundaryPath,
  changeCheckingFilePath,
  changeFilePreviewPath,
  changeNotInEdpPath,
  changeExcludedAreaPath,
  '/request-to-use/link-expired',
  '/request-to-use/enter-address'
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

    it('should redirect the review quote details page to the start page', async () => {
      const cookie = await createSession(getServer())

      const response = await getResponse({
        server: getServer(),
        requestUrl: reviewQuoteDetailsPath,
        cookie
      })

      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(startPath)
    })

    it('should redirect the accept levy page to the start page', async () => {
      const cookie = await createSession(getServer())

      const response = await getResponse({
        server: getServer(),
        requestUrl: acceptLevyPath,
        cookie
      })

      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(startPath)
    })

    it('should show the page not found page for the link expired page', async () => {
      const cookie = await createSession(getServer())

      const response = await getResponse({
        server: getServer(),
        requestUrl: linkExpiredPath,
        cookie
      })

      expect(response.statusCode).toBe(statusCodes.notFound)
    })

    describe('after starting again from the start page', () => {
      it('should redirect the email confirmation page to the start page', async () => {
        const { cookie } = await submitForm({
          requestUrl: startPath,
          server: getServer(),
          formData: {},
          cookie: await createSession(getServer())
        })

        const response = await getResponse({
          server: getServer(),
          requestUrl: emailConfirmationPath,
          cookie
        })

        expect(response.statusCode).toBe(statusCodes.found)
        expect(response.headers.location).toBe(startPath)
      })

      it('should redirect the email confirmation page to the start page once request to use is chosen again', async () => {
        const server = getServer()
        let { cookie } = await submitForm({
          requestUrl: startPath,
          server,
          formData: {},
          cookie: await createSession(server)
        })
        ;({ cookie } = await submitForm({
          requestUrl: whatWouldYouLikeToDoPath,
          server,
          formData: { whatWouldYouLikeToDo: 'request-to-use' },
          cookie
        }))

        const response = await getResponse({
          server,
          requestUrl: emailConfirmationPath,
          cookie
        })

        expect(response.statusCode).toBe(statusCodes.found)
        expect(response.headers.location).toBe(startPath)
      })
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
