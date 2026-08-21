import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdEnterCompanyNumber } from '../defra-id-enter-company-number/routes.js'

const pageHeading = 'Is this your business?'
const pageTitle = pageHeading
const businessName = 'HAMBLIN HOUSEBUILDERS LTD'
const registeredAddress = '5 High St, Leeds, LS1 9DJ, United Kingdom'

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdEnterCompanyNumber,
    businessName,
    registeredAddress
  }
}
