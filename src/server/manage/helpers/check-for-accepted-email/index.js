import { routePath as startPath } from '../../start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../what-would-you-like-to-do/route-path.js'
import { isRetrieveQuoteEmailSentSession } from '../../../request-to-use/helpers/retrieve-quote-email-sent/index.js'

/**
 * The what would you like to do page is the entry point after the start page,
 * so it is only closed once the retrieve quote email has been accepted. It
 * lives in the manage plugin, so the request to use guard cannot cover it.
 * Untyped on purpose: Sonar S3800 flags a typed guard that returns both
 * `h.continue` and a redirect, as the quote guard does untyped.
 * @param {import('@hapi/hapi').Request} request
 * @param {import('@hapi/hapi').ResponseToolkit} h
 */
export const checkForAcceptedEmail = (request, h) => {
  if (request.method !== 'get' || request.path !== whatWouldYouLikeToDoPath) {
    return h.continue
  }

  if (isRetrieveQuoteEmailSentSession(request)) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
