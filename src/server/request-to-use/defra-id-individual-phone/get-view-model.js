import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdIndividualName } from '../defra-id-individual-name/routes.js'

const pageHeading = 'What’s your telephone number?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdIndividualName
  }
}
