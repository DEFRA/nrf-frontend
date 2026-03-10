import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as routePathResidential } from '../residential/routes.js'
import { routePath as routePathPeopleCount } from '../people-count/routes.js'

export const title = 'Enter your email address'

export default function (quoteData) {
  const backLinkPath = quoteData.developmentTypes?.includes('other-residential')
    ? routePathPeopleCount
    : routePathResidential
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath
  }
}
