import { getQuoteDataFromCache } from '../../../quote/session-cache.js'
import { routePath as boundaryTypePath } from '../../../quote/boundary-type/routes.js'
import { routePath as confirmationPath } from '../../../quote/confirmation/routes.js'
import { routePath as startPath } from '../../../quote/start/routes.js'

const exemptPaths = [boundaryTypePath, confirmationPath]

export const checkForValidQuoteSession = (request, h) => {
  if (
    request.method !== 'get' ||
    !request.path.startsWith('/quote/') ||
    exemptPaths.includes(request.path)
  ) {
    return h.continue
  }

  const { boundaryEntryType } = getQuoteDataFromCache(request)
  if (!boundaryEntryType) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
