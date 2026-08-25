import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdBusinessYourPhone } from '../defra-id-business-your-phone/routes.js'

const pageHeading = 'Create a memorable word'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdBusinessYourPhone
  }
}
