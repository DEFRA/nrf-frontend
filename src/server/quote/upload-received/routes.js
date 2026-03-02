import { handler } from './controller.js'

export const routePath = '/quote/upload-received'

export default [
  {
    method: 'GET',
    path: routePath,
    handler
  }
]
