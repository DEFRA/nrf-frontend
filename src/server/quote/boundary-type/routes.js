import { quoteController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'

const routeId = 'boundary-type'
export const routePath = '/quote/boundary-type'

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
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
