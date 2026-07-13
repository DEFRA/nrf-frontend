import { routePath as routePathResidential } from '../units/routes.js'

export default function getNextPage({ isHousing }) {
  if (isHousing === 'yes') {
    return routePathResidential
  }

  return '/quote/not-housing'
}
