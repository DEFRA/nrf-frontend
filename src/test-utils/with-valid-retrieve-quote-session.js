import { submitForm } from './submit-form.js'
import { routePath as startPath } from '../server/manage/start-page/route-path.js'
import { routePath as whatWouldYouLikeToDoPath } from '../server/manage/what-would-you-like-to-do/route-path.js'

/**
 * Prime a retrieve quote session by driving the real routes: start page, then
 * choosing to request to use. Returns the session cookie.
 * @param {object} server
 * @returns {Promise<string>}
 */
export async function withValidRetrieveQuoteSession(server) {
  const { cookie } = await submitForm({
    requestUrl: startPath,
    server,
    formData: {}
  })
  const { cookie: updatedCookie } = await submitForm({
    requestUrl: whatWouldYouLikeToDoPath,
    server,
    formData: { whatWouldYouLikeToDo: 'request-to-use' },
    cookie
  })
  return updatedCookie
}
