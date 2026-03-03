import { handler } from './controller.js'

export const routePath = '/quote/upload-boundary'

export default [
  {
    method: 'GET',
    path: routePath,
    handler
  }
]
