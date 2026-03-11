import { routePath as routePathResidentialUnits } from '../residential/routes.js'
import { routePath as routePathPeopleCount } from '../people-count/routes.js'

export default function getNextPage(payload) {
  if (payload.developmentTypes.includes('housing')) {
    return routePathResidentialUnits
  }
  return routePathPeopleCount
}
