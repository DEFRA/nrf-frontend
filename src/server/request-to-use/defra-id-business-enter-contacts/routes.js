import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-enter-contacts'
export const routeDefraIdBusinessEnterContacts =
  '/request-to-use/defra-id-business-enter-contacts'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessEnterContacts,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessEnterContacts,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
