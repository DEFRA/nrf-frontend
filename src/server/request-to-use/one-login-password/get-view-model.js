import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Enter your password'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '/request-to-use/one-login-email-address'
  }
}
