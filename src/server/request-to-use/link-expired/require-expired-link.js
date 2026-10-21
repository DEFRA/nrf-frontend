import Boom from '@hapi/boom'
import { expiredLinkSession } from '../helpers/expired-link-session/index.js'

/**
 * Shows the page not found page unless the user got here from a used or timed
 * out magic link. Without that link's token there is nothing to exchange for a
 * new one.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const requireExpiredLink = (request, h) => {
  if (!expiredLinkSession.get(request)) {
    throw Boom.notFound()
  }
  return h.continue
}
