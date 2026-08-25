import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'sign-in-how'
export const routeSignInHow = `/request-to-use/${routeId}`

export default [
  {
    method: 'GET',
    path: routeSignInHow,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeSignInHow,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
