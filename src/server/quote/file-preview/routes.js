import joi from 'joi'
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
    options: {
      // The Save-and-continue form posts no fields (the crumb plugin strips
      // csrfToken before validation), so the schema is an empty object.
      validate: {
        payload: joi.object()
      }
    },
    handler: postHandler
  }
]
