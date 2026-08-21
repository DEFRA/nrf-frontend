import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-enter-company-number'
export const routeDefraIdEnterCompanyNumber =
  '/request-to-use/defra-id-enter-company-number'

export default [
  {
    method: 'GET',
    path: routeDefraIdEnterCompanyNumber,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdEnterCompanyNumber,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
