import { routePath as routePathUploadBoundary } from '../upload-boundary/routes.js'

export default function ({ boundaryEntryType }) {
  if (boundaryEntryType === 'upload') {
    return routePathUploadBoundary
  }

  return '/quote/next'
}
