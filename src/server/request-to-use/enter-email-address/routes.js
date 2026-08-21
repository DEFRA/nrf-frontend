import { requestToUseController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'enter-email-address'
export const routeEnterEmailAddress = '/request-to-use/enter-email-address'

export default [
  {
    method: 'GET',
    path: routeEnterEmailAddress,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeEnterEmailAddress,
    ...quotePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
