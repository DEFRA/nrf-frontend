import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading =
  'Enter your email address to sign in to your GOV.UK One Login'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
