import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdBusinessYourName } from '../defra-id-business-your-name/routes.js'

const pageHeading = 'What’s your telephone number?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdBusinessYourName
  }
}
