import { routePath as boundaryTypePath } from '../../boundary-type/routes.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../start/routes.js'
import { getQuoteDataFromCache } from '../get-quote-session/index.js'

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
