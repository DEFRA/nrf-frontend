import { routePath as applicationTypeNotAvailablePath } from '../application-type-not-available/routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'

export default function getNextPage({ planningType }) {
  if (planningType === 'other') {
    return applicationTypeNotAvailablePath
  }

  return boundaryTypePath
}
