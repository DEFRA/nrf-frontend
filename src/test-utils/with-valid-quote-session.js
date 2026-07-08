import { submitForm } from './submit-form.js'
import { routePath as startPath } from '../server/quote/start/routes.js'

export const withValidQuoteSession = async (server, requestUrl = null) => {
  const { cookie } = await submitForm({
    requestUrl: startPath,
    server,
    formData: {}
  })
  if (!requestUrl) return cookie
  const { cookie: updatedCookie } = await submitForm({
    requestUrl,
    server,
    formData: {},
    cookie
  })
  return updatedCookie
}
