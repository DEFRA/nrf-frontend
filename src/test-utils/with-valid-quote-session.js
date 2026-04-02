import { submitForm } from './submit-form.js'
import { routePath as boundaryTypePath } from '../server/quote/boundary-type/routes.js'

export const withValidQuoteSession = async (server, requestUrl = null) => {
  const { cookie } = await submitForm({
    requestUrl: boundaryTypePath,
    server,
    formData: { boundaryEntryType: 'upload' }
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
