import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'How do you want to sign in?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
