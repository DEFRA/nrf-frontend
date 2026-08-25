import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdBusinessCompanyNumber } from '../defra-id-business-company-number/routes.js'

const pageHeading = 'What’s your company registration number?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdBusinessCompanyNumber
  }
}
