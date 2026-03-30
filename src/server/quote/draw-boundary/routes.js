import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'draw-boundary'
export const routePath = '/quote/draw-boundary'

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  }
]
