import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = 'Enter your email address'

export default function () {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '#'
  }
}
