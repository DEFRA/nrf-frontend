import { handler, postHandler } from './controller.js'

export const routePath = '/quote/file-preview'

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
