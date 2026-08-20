import getViewModel from './get-view-model.js'
import { checkYourAnswersGetController } from './controller-get.js'

const routeId = 'check-your-answers'
export const routePathCheckYourAnswers = `/request-to-use/${routeId}`

export default [
  {
    method: 'GET',
    path: routePathCheckYourAnswers,
    ...checkYourAnswersGetController({ routeId, getViewModel })
  }
]
