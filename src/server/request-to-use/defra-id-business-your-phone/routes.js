import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-your-phone'
export const routeDefraIdBusinessYourPhone =
  '/request-to-use/defra-id-business-your-phone'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessYourPhone,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessYourPhone,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
