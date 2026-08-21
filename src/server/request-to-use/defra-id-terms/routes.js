import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-terms'
export const routeDefraIdTerms = '/request-to-use/defra-id-terms'

export default [
  {
    method: 'GET',
    path: routeDefraIdTerms,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdTerms,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
