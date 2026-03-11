import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathResidential } from '../residential/routes.js'
import { routePath as routePathDevelopmentTypes } from '../development-types/routes.js'

export const title =
  'What is the maximum number of people the development will serve?'

export default function getViewModel(quoteData) {
  const backLinkPath = quoteData.developmentTypes?.includes('housing')
    ? routePathResidential
    : routePathDevelopmentTypes
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath
  }
}
