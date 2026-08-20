import { quoteController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'enter-nrl-reference'
export const routeEnterNrlReference = '/request-to-use/enter-nrl-reference'

export default [
  {
    method: 'GET',
    path: routeEnterNrlReference,
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeEnterNrlReference,
    ...quotePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
