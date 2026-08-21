import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'nrl-reference'
export const routeNrlReference = '/request-to-use/nrl-reference'

export default [
  {
    method: 'GET',
    path: routeNrlReference,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeNrlReference,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
