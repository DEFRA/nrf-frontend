import { handler, postHandler } from './controller.js'

export const routePath = '/quote/upload-preview-map'

export default [
  {
    method: 'GET',
    path: routePath,
    handler
  },
  {
    method: 'POST',
    path: routePath,
    handler: postHandler
  }
]
