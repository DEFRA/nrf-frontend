import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'You need to register for a Defra account'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
