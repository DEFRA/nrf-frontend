import { quoteController } from '../../../quote/controller-get.js'
import getDrawBoundaryViewModel from '../../../quote/draw-boundary/get-view-model.js'
import { createDrawBoundaryApiRoutes } from '../../../quote/draw-boundary/routes.js'
import { createSaveBoundaryHandler } from '../../../quote/draw-boundary/controller.js'
import { routePath as changeBoundaryTypePath } from '../boundary-type/route-path.js'
import { routePath as reviewQuoteDetailsPath } from '../../review-quote-details/route-path.js'
import { routePath } from './route-path.js'

export { routePath }
export const checkPath = '/request-to-use/change/draw-boundary/check'
export const savePath = '/request-to-use/change/draw-boundary/save'

/**
 * The alias serves the quote draw boundary page's own template, so the view
 * model spreads the quote page's and repoints the map's endpoints and back
 * link at the change alias: geometry checks, saves and the back link all stay
 * inside the request to use journey.
 * @param {object} quoteData - the quote session data
 * @returns {object} view model for the change draw boundary page
 */
const getViewModel = (quoteData) => ({
  ...getDrawBoundaryViewModel(quoteData),
  boundaryValidationUrl: checkPath,
  saveAndContinueUrl: savePath,
  backLinkPath: changeBoundaryTypePath
})

/**
 * @openapi
 * /request-to-use/change/draw-boundary:
 *   get:
 *     tags:
 *       - RequestToUse
 *     summary: Change boundary by drawing page
 *     description: Renders the quote journey's draw boundary map to redraw the boundary from the review and amend your quote details page
 *     responses:
 *       200:
 *         description: HTML map page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 * /request-to-use/change/draw-boundary/check:
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Validate drawn geometry
 *     description: Validates geometry drawn on the map against the backend boundary check
 *     responses:
 *       200:
 *         description: Checked geojson
 *       400:
 *         description: Validation failure with resolved error copy
 * /request-to-use/change/draw-boundary/save:
 *   post:
 *     tags:
 *       - RequestToUse
 *     summary: Save a drawn boundary
 *     description: Saves the drawn boundary to the quote session and redirects to the review and amend page, or to the eligibility outcome page
 *     responses:
 *       303:
 *         description: Redirect to the review and amend page, or to the excluded area or no EDP page
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId: 'draw-boundary', getViewModel })
  },
  ...createDrawBoundaryApiRoutes({
    checkPath,
    savePath,
    // A boundary that intersects an EDP saves and returns to the review page.
    // The excluded-area and no-EDP outcomes keep their quote journey paths —
    // their behaviour when reached from a change link is NRF2-1314.
    saveHandler: createSaveBoundaryHandler({
      successPath: reviewQuoteDetailsPath
    })
  })
]
