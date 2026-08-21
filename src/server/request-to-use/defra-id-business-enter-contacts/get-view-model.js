import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdBusinessConfirmName } from '../defra-id-business-confirm-name/routes.js'

const pageHeading = 'What’s the business’s telephone number and email address?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdBusinessConfirmName
  }
}
