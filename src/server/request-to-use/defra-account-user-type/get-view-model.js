import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as acceptLevyPath } from '../accept-levy/route-path.js'
import { defraAccountUserTypeOptions } from './options.js'

export const pageHeading =
  'Who are you requesting to use the nature restoration levy for?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: acceptLevyPath,
    defraAccountUserTypeOptions
  }
}
