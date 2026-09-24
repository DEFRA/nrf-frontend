import { handler, postHandler } from './controller.js'
import { routePath } from './route-path.js'

export { routePath }

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
