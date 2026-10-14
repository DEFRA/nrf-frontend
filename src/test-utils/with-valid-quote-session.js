import { submitForm } from './submit-form.js'
import { routePath as startPath } from '../server/manage/start-page/routes.js'
import { routePath as whatWouldYouLikeToDoPath } from '../server/manage/what-would-you-like-to-do/route-path.js'

export const withValidQuoteSession = async (server, requestUrl = null) => {
  let { cookie } = await submitForm({
    requestUrl: startPath,
    server,
    formData: {}
  })
  ;({ cookie } = await submitForm({
    requestUrl: whatWouldYouLikeToDoPath,
    server,
    formData: { whatWouldYouLikeToDo: 'quote' },
    cookie
  }))
  if (!requestUrl) return cookie
  const { cookie: updatedCookie } = await submitForm({
    requestUrl,
    server,
    formData: {},
    cookie
  })
  return updatedCookie
}
