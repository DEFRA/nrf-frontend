import { confirmationGetController } from './controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'confirmation'
export const routePath = `/quote/${routeId}`

export default [
  {
    method: 'GET',
    path: routePath,
    ...confirmationGetController({ routeId, getViewModel })
  }
]
