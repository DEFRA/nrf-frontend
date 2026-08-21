import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdBusinessEnterContacts } from '../defra-id-business-enter-contacts/routes.js'

const pageHeading = 'What’s your name?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdBusinessEnterContacts
  }
}
