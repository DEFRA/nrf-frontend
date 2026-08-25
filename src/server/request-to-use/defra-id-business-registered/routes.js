import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-registered'
export const routeDefraIdBusinessRegistered =
  '/request-to-use/defra-id-business-registered'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessRegistered,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessRegistered,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
