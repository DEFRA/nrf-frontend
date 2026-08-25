import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-business-memorable-word'
export const routeDefraIdBusinessMemorableWord =
  '/request-to-use/defra-id-business-memorable-word'

export default [
  {
    method: 'GET',
    path: routeDefraIdBusinessMemorableWord,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdBusinessMemorableWord,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
