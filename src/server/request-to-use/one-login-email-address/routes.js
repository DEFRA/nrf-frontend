import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'one-login-email-address'
export const routeOneLoginEmailAddress =
  '/request-to-use/one-login-email-address'

export default [
  {
    method: 'GET',
    path: routeOneLoginEmailAddress,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeOneLoginEmailAddress,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
