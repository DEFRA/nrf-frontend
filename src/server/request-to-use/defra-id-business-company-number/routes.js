import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-company-number'
export const routeDefraIdBusinessCompanyNumber =
  '/request-to-use/defra-id-business-company-number'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessCompanyNumber,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessCompanyNumber,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
