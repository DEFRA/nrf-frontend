import { getPageTitle } from '../../common/helpers/page-title.js'
import { config } from '../../../config/config.js'
import { checkPath, savePath } from './routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { routePath as checkYourAnswersPath } from '../check-your-answers/routes.js'

export const title = 'Draw your boundary on a map'

export default function getViewModel(quoteData = {}, query = {}) {
  const existingBoundaryGeojson =
    quoteData?.boundaryGeojson?.boundaryGeometryWgs84 ?? null
  const existingBoundaryMetadata =
    quoteData.boundaryGeojson?.boundaryMetadata ?? null

  // When editing from check-your-answers, always return there instead of the
  // boundary type page
  const backLinkPath =
    query.change === 'true' ? checkYourAnswersPath : boundaryTypePath

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    mapStyleUrl: config.get('map.defaultStyleUrl'),
    impactAssessorLayers: config.get('map.impactAssessorLayers'),
    boundaryValidationUrl: checkPath,
    saveAndContinueUrl: savePath,
    backLinkPath,
    existingBoundaryGeojson: JSON.stringify(existingBoundaryGeojson),
    existingBoundaryMetadata: JSON.stringify(existingBoundaryMetadata)
  }
}
