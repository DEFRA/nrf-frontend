import { routePath as startPath } from '../../start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../what-would-you-like-to-do/route-path.js'
import { isRetrieveQuoteEmailSentSession } from '../../../request-to-use/helpers/retrieve-quote-email-sent/index.js'

/**
 * The what would you like to do page is the entry point after the start page,
 * so it is only closed once the retrieve quote email has been accepted. It
 * lives in the manage plugin, so the request to use guard cannot cover it.
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 */
export const checkForAcceptedEmail = (request, h) => {
  const isClosed =
    request.method === 'get' &&
    request.path === whatWouldYouLikeToDoPath &&
    isRetrieveQuoteEmailSentSession(request)

  // A single return keeps Sonar S3800 (differing return types) quiet
  return isClosed ? h.redirect(startPath).takeover() : h.continue
}
