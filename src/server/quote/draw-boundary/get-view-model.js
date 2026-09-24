import { getPageTitle } from '../../common/helpers/page-title.js'
import { config } from '../../../config/config.js'
import { checkPath, savePath } from './routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/route-path.js'

const pageHeading = 'Draw your boundary on a map'
const pageTitle = 'Draw boundary'

export default function getViewModel(quoteData = {}) {
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
    saveAndContinueUrl: savePath,
    backLinkPath: boundaryTypePath,
    existingBoundaryGeojson: JSON.stringify(existingBoundaryGeojson),
    existingBoundaryMetadata: JSON.stringify(existingBoundaryMetadata)
  }
}
