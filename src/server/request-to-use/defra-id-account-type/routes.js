import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-account-type'
export const routeDefraIdAccountType = '/request-to-use/defra-id-account-type'

export default [
  {
    method: 'GET',
    path: routeDefraIdAccountType,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdAccountType,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
