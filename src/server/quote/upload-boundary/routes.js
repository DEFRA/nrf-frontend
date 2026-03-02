import { handler as getHandler } from './controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'

const routeId = 'upload-boundary'
export const routePath = '/quote/upload-boundary'

export default [
  {
    method: 'GET',
    path: routePath,
    handler: getHandler
  },
  {
    method: 'POST',
    path: routePath,
    ...quotePostController({
      routeId,
      formValidation,
      getViewModel,
      getNextPage
    })
  }
]
