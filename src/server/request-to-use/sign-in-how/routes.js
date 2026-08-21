import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'sign-in-how'
export const routeSignInHow = `/request-to-use/${routeId}`

export default [
  {
    method: 'GET',
    path: routeSignInHow,
    ...requestToUseController({ routeId, getViewModel })
  }
]
