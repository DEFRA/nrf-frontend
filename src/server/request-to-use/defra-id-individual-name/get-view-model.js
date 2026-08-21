import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdAccountType } from '../defra-id-account-type/routes.js'

const pageHeading = 'What’s your name?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdAccountType
  }
}
