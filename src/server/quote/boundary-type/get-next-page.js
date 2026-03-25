import { routePath as routePathUploadBoundary } from '../upload-boundary/routes.js'
import { routePath as routePathDrawBoundary } from '../draw-boundary/routes.js'

export default function getNextPage({ boundaryEntryType }) {
  if (boundaryEntryType === 'upload') {
    return routePathUploadBoundary
  }

  return routePathDrawBoundary
}
