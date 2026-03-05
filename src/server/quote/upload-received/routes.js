import { handler, checkBoundaryHandler } from './controller.js'

export const routePath = '/quote/upload-received'
export const checkBoundaryPath = '/quote/check-boundary/{id}'

export default [
  {
    method: 'GET',
    path: routePath,
    handler
  },
  {
    method: 'POST',
    path: checkBoundaryPath,
    handler: checkBoundaryHandler
  }
]
