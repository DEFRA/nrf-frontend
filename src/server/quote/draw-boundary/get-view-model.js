import { getPageTitle } from '../../common/helpers/page-title.js'
import { config } from '../../../config/config.js'
import { checkPath, savePath } from './routes.js'
import { routePath as osNamesSearchPath } from '../../os-names-search/routes.js'

export const title = 'Draw your boundary on a map'

export default function getViewModel(quoteData = {}) {
  const existingBoundaryGeojson =
    quoteData?.boundaryGeojson?.boundaryGeometryWgs84 ?? null
  const existingBoundaryMetadata =
    quoteData.boundaryGeojson?.boundaryMetadata ?? null

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    mapStyleUrl: config.get('map.defaultStyleUrl'),
    impactAssessorLayers: config.get('map.impactAssessorLayers'),
    boundaryValidationUrl: checkPath,
    saveAndContinueUrl: savePath,
    osNamesUrl: `${osNamesSearchPath}?query={query}`,
    existingBoundaryGeojson: JSON.stringify(existingBoundaryGeojson),
    existingBoundaryMetadata: JSON.stringify(existingBoundaryMetadata)
  }
}
