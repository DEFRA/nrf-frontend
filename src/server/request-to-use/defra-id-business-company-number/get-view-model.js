import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdBusinessRegistered } from '../defra-id-business-registered/routes.js'

const pageHeading = 'Do you have a company registration number?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdBusinessRegistered
  }
}
