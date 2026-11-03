import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { variationOptions } from './options.js'

export const pageHeading =
  'Is the development an amendment to an existing planning permission?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: acceptLevyPath,
    variationOptions
  }
}
