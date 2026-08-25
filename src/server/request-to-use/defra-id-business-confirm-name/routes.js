import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-confirm-name'
export const routeDefraIdBusinessConfirmName =
  '/request-to-use/defra-id-business-confirm-name'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessConfirmName,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessConfirmName,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
