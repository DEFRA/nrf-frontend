import getDrawBoundaryViewModel from '../../../quote/draw-boundary/get-view-model.js'
import { routePath as changeBoundaryTypePath } from '../boundary-type/route-path.js'
import { checkPath, savePath } from './routes.js'

/**
 * The alias serves the quote draw boundary page's own template, so the view
 * model spreads the quote page's and repoints the map's endpoints and back
 * link at the change alias: geometry checks, saves and the back link all stay
 * inside the request to use journey.
 * @param {object} quoteData - the quote session data
 * @returns {object} view model for the change draw boundary page
 */
export default function getViewModel(quoteData) {
  return {
    ...getDrawBoundaryViewModel(quoteData),
    boundaryValidationUrl: checkPath,
    saveAndContinueUrl: savePath,
    backLinkPath: changeBoundaryTypePath
  }
}
