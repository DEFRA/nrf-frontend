import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-what-address'
export const routeDefraIdWhatAddress = '/request-to-use/defra-id-what-address'

export default [
  {
    method: 'GET',
    path: routeDefraIdWhatAddress,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdWhatAddress,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
