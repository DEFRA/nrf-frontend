import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'confirmation'
export const routeConfirmation = '/request-to-use/confirmation'

export default [
  {
    method: 'GET',
    path: routeConfirmation,
    ...requestToUseController({ routeId, getViewModel })
  }
]
