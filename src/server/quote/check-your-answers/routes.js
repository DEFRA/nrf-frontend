import { quoteController } from '../controller-get.js'
import { quoteSubmitController } from './controller-post.js'
import getViewModel from './get-view-model.js'

const routeId = 'check-your-answers'
export const routePath = `/quote/${routeId}`

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...quoteSubmitController
  }
]
