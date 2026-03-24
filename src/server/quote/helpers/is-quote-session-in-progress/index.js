import { routePath as boundaryTypePath } from '../../boundary-type/routes.js'
import { routePath as confirmationPath } from '../../confirmation/routes.js'
import { routePath as startPath } from '../../start/routes.js'
import { getQuoteDataFromCache } from '../quote-session-cache/index.js'
import { routePath as deleteConfirmationPath } from '../../delete-quote-confirmation/routes.js'

const exemptPaths = new Set([
  boundaryTypePath,
  confirmationPath,
  deleteConfirmationPath
])

export const checkForValidQuoteSession = (request, h) => {
  if (
    request.method !== 'get' ||
    !request.path.startsWith('/quote/') ||
    exemptPaths.has(request.path)
  ) {
    return h.continue
  }

  const { boundaryEntryType } = getQuoteDataFromCache(request)
  if (!boundaryEntryType) {
    return h.redirect(startPath).takeover()
  }

  return h.continue
}
