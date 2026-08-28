import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-individual-name'
export const routeDefraIdIndividualName =
  '/request-to-use/defra-id-individual-name'

export default [
  {
    method: 'GET',
    path: routeDefraIdIndividualName,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdIndividualName,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
