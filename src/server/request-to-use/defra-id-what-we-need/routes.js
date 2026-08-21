import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-what-we-need'
export const routeDefraIdWhatWeNeed = '/request-to-use/defra-id-what-we-need'

export default [
  {
    method: 'GET',
    path: routeDefraIdWhatWeNeed,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdWhatWeNeed,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
