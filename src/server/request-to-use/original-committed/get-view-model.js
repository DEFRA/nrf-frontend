import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as variationPath } from '../variation/route-path.js'
import { originalCommittedOptions } from './options.js'

export const pageHeading =
  'Was the original planning permission committed to using the nature restoration levy?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: variationPath,
    originalCommittedOptions
  }
}
