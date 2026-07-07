import { submitForm } from './submit-form.js'
import { routePath as planningTypePath } from '../server/quote/planning-type/routes.js'

export const withValidQuoteSession = async (server, requestUrl = null) => {
  const { cookie } = await submitForm({
    requestUrl: planningTypePath,
    server,
    formData: { planningType: 'full-planning-permission' }
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
