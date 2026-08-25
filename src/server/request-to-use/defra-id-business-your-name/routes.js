import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-your-name'
export const routeDefraIdBusinessYourName =
  '/request-to-use/defra-id-business-your-name'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessYourName,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessYourName,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
