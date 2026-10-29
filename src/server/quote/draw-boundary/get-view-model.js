import { getPageTitle } from '../../common/helpers/page-title.js'
import { config } from '../../../config/config.js'
import { checkPath, savePath } from './routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/route-path.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'

const pageHeading = 'Draw your boundary on a map'
const pageTitle = 'Draw boundary'

/**
 * @param {object} [quoteData] - the quote session data
 * @param {object} [query] - the parsed request query
 * @returns {object} view model for the draw boundary page
 */
export default function getViewModel(quoteData = {}, query = {}) {
  const existingBoundaryGeojson =
    quoteData?.boundaryGeojson?.boundaryGeometryWgs84 ?? null
  const existingBoundaryMetadata =
    quoteData.boundaryGeojson?.boundaryMetadata ?? null

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    mapStyleUrl: config.get('map.defaultStyleUrl'),
    impactAssessorLayers: config.get('map.impactAssessorLayers'),
    boundaryValidationUrl: checkPath,
    // The map client reads these URLs verbatim from the page's data
    // attributes, so change mode must be baked in here for the save POST and
    // back link to keep it alive.
    saveAndContinueUrl: appendChangeParam(savePath, query),
    backLinkPath: appendChangeParam(boundaryTypePath, query),
    existingBoundaryGeojson: JSON.stringify(existingBoundaryGeojson),
    existingBoundaryMetadata: JSON.stringify(existingBoundaryMetadata)
  }
}
