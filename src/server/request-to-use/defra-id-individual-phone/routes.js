import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-individual-phone'
export const routeDefraIdIndividualPhone =
  '/request-to-use/defra-id-individual-phone'

export default [
  {
    method: 'GET',
    path: routeDefraIdIndividualPhone,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdIndividualPhone,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
