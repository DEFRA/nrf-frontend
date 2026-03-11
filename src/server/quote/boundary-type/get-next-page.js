import { routePath as routePathUploadBoundary } from '../upload-boundary/routes.js'

export default function getNextPage({ boundaryEntryType }) {
  if (boundaryEntryType === 'upload') {
    return routePathUploadBoundary
  }

  return '/quote/next'
}
