import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-register'
export const routeDefraIdRegister = '/request-to-use/defra-id-register'

export default [
  {
    method: 'GET',
    path: routeDefraIdRegister,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdRegister,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
