import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Enter your email address'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
