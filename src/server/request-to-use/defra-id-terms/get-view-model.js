import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdRegister } from '../defra-id-register/routes.js'

const pageHeading = 'Your Defra account terms and conditions'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdRegister
  }
}
