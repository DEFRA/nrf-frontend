import { handler } from './controller.js'

export const routePath = '/upload-received'

export default [
  {
    method: 'GET',
    path: routePath,
    handler
  }
]
