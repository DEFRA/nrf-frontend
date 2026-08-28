import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-check-details-individual'
export const routeDefraIdCheckDetailsIndividual =
  '/request-to-use/defra-id-check-details-individual'

export default [
  {
    method: 'GET',
    path: routeDefraIdCheckDetailsIndividual,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdCheckDetailsIndividual,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
