import Boom from '@hapi/boom'
import joi from 'joi'
import { quoteController } from '../controller-get.js'
import { quoteSubmitController } from './controller-post.js'
import getViewModel from './get-view-model.js'
import { quoteSubmitRateLimitPre } from '../helpers/session-rate-limit/index.js'
import { isQuoteDataComplete } from '../helpers/quote-session-cache/index.js'
import { routePath } from './route-path.js'

const routeId = 'check-your-answers'

// Incomplete quotes must fail with the 400 error page rather than reach the
// view or the submit controller.
const completeQuotePre = {
  method: function validateQuoteIsComplete(request, h) {
    if (!isQuoteDataComplete(request)) {
      throw Boom.badRequest()
    }
    return h.continue
  }
}

export { routePath }

/**
 * @openapi
 * /quote/check-your-answers:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Check your answers page
 *     description: Renders the quote summary page for review before submission
 *     responses:
 *       200:
 *         description: HTML summary page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Quote is incomplete — renders the 400 error page
 *   post:
 *     tags:
 *       - Quote
 *     summary: Submit quote
 *     description: Submits the quote to the backend API
 *     responses:
 *       303:
 *         description: Redirect to confirmation page with reference number
 *       400:
 *         description: Quote is incomplete — renders the 400 error page
 */
export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      pre: [completeQuotePre]
    },
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    options: {
      // The Confirm-and-submit form posts no fields (the crumb plugin strips
      // csrfToken before validation), so the schema is an empty object.
      validate: {
        payload: joi.object()
      },
      pre: [quoteSubmitRateLimitPre, completeQuotePre]
    },
    ...quoteSubmitController
  }
]
