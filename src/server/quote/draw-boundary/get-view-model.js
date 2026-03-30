import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { config } from '../../../config/config.js'

export const title = 'Draw your boundary on a map'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: boundaryTypePath,
    mapStyleUrl: config.get('map.defaultStyleUrl')
  }
}
