import getViewModel from './get-view-model.js'
import { requestToUseController } from '../controller-get.js'

const routeId = 'check-your-answers'
export const routePathCheckYourAnswers = `/request-to-use/${routeId}`

export default [
  {
    method: 'GET',
    path: routePathCheckYourAnswers,
    ...requestToUseController({ routeId, getViewModel })
  }
]
