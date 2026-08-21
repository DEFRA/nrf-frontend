import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-check-details'
export const routeDefraIdBusinessCheckDetails =
  '/request-to-use/defra-id-business-check-details'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessCheckDetails,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessCheckDetails,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
