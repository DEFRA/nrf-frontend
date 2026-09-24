import { routePath as routePathUploadBoundary } from '../upload-boundary/route-path.js'
import { routePath as routePathDrawBoundary } from '../draw-boundary/route-path.js'

export default function getNextPage({ boundaryEntryType }) {
  if (boundaryEntryType === 'upload') {
    return routePathUploadBoundary
  }

  return routePathDrawBoundary
}
