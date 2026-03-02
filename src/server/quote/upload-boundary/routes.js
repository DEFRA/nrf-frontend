import { quoteController } from '../controller-get.js'
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
    ...quoteController({ routeId, getViewModel })
  },
  {
    /* Temporary handler to allow file upload until we integrate with the cdp-uploader */
    method: 'POST',
    path: routePath,
    ...quotePostController({
      routeId,
      formValidation,
      getViewModel,
      getNextPage,
      payloadOptions: {
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 2 * 1024 * 1024 // 2MB
      }
    })
  }
]
