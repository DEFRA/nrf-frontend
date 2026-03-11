import { submitForm } from './submit-form.js'
import { routePath as boundaryTypePath } from '../server/quote/boundary-type/routes.js'

export const withValidQuoteSession = async (server) => {
  const { cookie } = await submitForm({
    requestUrl: boundaryTypePath,
    server,
    formData: { boundaryEntryType: 'upload' }
  })
  return cookie
}
