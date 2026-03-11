import { routePath as routePathPeopleCount } from '../people-count/routes.js'
import { routePath as routePathEmail } from '../email/routes.js'

export default function getNextPage(quoteData) {
  if (quoteData.developmentTypes.includes('other-residential')) {
    return routePathPeopleCount
  }
  return routePathEmail
}
