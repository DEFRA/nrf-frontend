import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdWhatAddress } from '../defra-id-what-address/routes.js'

const pageHeading = 'Select your address'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdWhatAddress
  }
}
