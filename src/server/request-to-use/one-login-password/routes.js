import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'one-login-password'
export const routeOneLoginPassword = '/request-to-use/one-login-password'

export default [
  {
    method: 'GET',
    path: routeOneLoginPassword,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeOneLoginPassword,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
