import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-select-address'
export const routeDefraIdSelectAddress =
  '/request-to-use/defra-id-select-address'

export default [
  {
    method: 'GET',
    path: routeDefraIdSelectAddress,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdSelectAddress,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
