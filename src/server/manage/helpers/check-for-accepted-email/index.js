import { routePath as startPath } from '../../start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../what-would-you-like-to-do/route-path.js'
import { isRetrieveQuoteEmailSentSession } from '../../../request-to-use/helpers/retrieve-quote-email-sent/index.js'

/**
 * The what would you like to do page is the entry point after the start page,
 * so it is only closed once the retrieve quote email has been accepted. It
 * lives in the manage plugin, so the request to use guard cannot cover it.
 * @type {import('@hapi/hapi').Lifecycle.Method}
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
