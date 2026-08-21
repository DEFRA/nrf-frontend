import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'defra-id-memorable-word'
export const routeDefraIdMemorableWord =
  '/request-to-use/defra-id-memorable-word'

export default [
  {
    method: 'GET',
    path: routeDefraIdMemorableWord,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeDefraIdMemorableWord,
    ...requestToUsePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
