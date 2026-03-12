import { routePath as routePathUploadBoundary } from '../upload-boundary/routes.js'

export default function getNextPage({ boundaryCorrect }) {
  if (boundaryCorrect === 'no') {
    return routePathUploadBoundary
  }

  return '/quote/development-types'
}
