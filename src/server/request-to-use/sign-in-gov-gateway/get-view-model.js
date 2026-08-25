import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeSignInHow } from '../sign-in-how/routes.js'

const pageHeading = 'Sign in using Government Gateway'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeSignInHow
  }
}
