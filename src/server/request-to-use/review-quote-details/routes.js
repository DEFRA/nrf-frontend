import joi from 'joi'
import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { reviewQuoteDetailsPostController } from './controller-post.js'
import { routeId, routePath } from './route-path.js'

export { routePath }

export default [
  {
    method: 'GET',
    path: routePath,
    ...requestToUseController({
      routeId,
      getViewModel
    })
  },
  {
    method: 'POST',
    path: routePath,
    options: { validate: { payload: joi.object({}) } },
    ...reviewQuoteDetailsPostController
  }
]
