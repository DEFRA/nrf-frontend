import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'sign-in-gov-gateway'
export const routeSignInGovGateway = '/request-to-use/sign-in-gov-gateway'

export default [
  {
    method: 'GET',
    path: routeSignInGovGateway,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeSignInGovGateway,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
