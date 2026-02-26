import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'no-edp'
export const routePath = '/quote/no-edp'

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  }
]
