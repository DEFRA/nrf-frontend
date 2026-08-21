import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'enter-nrl-reference'
export const routeEnterNrlReference = '/request-to-use/enter-nrl-reference'

export default [
  {
    method: 'GET',
    path: routeEnterNrlReference,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeEnterNrlReference,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
