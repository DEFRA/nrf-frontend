import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdIndividualPhone } from '../defra-id-individual-phone/routes.js'

const pageHeading = 'What is your address?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdIndividualPhone
  }
}
