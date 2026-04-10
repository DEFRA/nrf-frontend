import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { config } from '../../../config/config.js'
import { checkPath, savePath } from './routes.js'

export const title = 'Draw your boundary on a map'

export default function getViewModel(quoteData = {}) {
  const existingBoundaryGeojson =
    quoteData?.boundaryGeojson?.boundaryGeometryWgs84 ?? null

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: boundaryTypePath,
    mapStyleUrl: config.get('map.defaultStyleUrl'),
    impactAssessorLayers: config.get('map.impactAssessorLayers'),
    boundaryValidationUrl: checkPath,
    saveAndContinueUrl: savePath,
    existingBoundaryGeojson: JSON.stringify(existingBoundaryGeojson)
  }
}
