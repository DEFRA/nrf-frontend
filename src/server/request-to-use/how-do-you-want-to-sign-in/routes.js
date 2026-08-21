import { requestToUseController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'how-do-you-want-to-sign-in'
export const routeHowDoYouWantToSignIn =
  '/request-to-use/how-do-you-want-to-sign-in'

/**
 * @openapi
 * /request-to-use/how-do-you-want-to-sign-in:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Sign-in method page
 *     description: Renders the page asking how the user wants to sign in
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
export default [
  {
    method: 'GET',
    path: routeHowDoYouWantToSignIn,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeHowDoYouWantToSignIn,
    ...quotePostController({
      routeId,
      getViewModel,
      getNextPage
    })
  }
]
