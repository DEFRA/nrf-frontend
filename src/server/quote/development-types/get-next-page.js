import { routePath as routePathResidentialUnits } from '../residential/routes.js'

export default function getNextPage(payload) {
  if (payload.developmentTypes.includes('housing')) {
    return routePathResidentialUnits
  }
  // return the next page to redirect to
  return '/quote/next'
}
