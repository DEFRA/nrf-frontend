import { routePath as routePathResidential } from '../units/routes.js'
import { routePath as routePathNotHousing } from '../not-housing/routes.js'

export default function getNextPage({ isHousing }) {
  if (isHousing === 'yes') {
    return routePathResidential
  }

  return routePathNotHousing
}
