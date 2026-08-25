import { requestToUseController } from '../controller-get.js'
import { requestToUsePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import getNextPage from './get-next-page.js'

const routeId = 'what-is-address-individual-business'
export const routeWhatIsAddressIndividualBusiness =
  '/request-to-use/what-is-address-individual-business'

/**
 * @openapi
 * /request-to-use/developer-details:
 *   get:
 *     tags:
 *       - Request to use
 *     summary: Developer details page
 *     description: Renders the developer details form for the nature restoration levy
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
    path: routeWhatIsAddressIndividualBusiness,
    ...requestToUseController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routeWhatIsAddressIndividualBusiness,
    ...requestToUsePostController({ routeId, getViewModel, getNextPage })
  }
]
