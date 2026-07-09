import { routePath as routePathResidential } from '../residential/routes.js'

export default function getNextPage({ isHousing }) {
  if (isHousing === 'yes') {
    return routePathResidential
  }

  return '/quote/not-housing'
}
