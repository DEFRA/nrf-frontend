import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'start'
export const routePath = `/quote/${routeId}`

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  }
]
